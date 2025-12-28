# Template-Goal Assignment System

## Overview

**Problem Solved**: Fuzzy matching wasn't reliable - templates with wrong question types (money problems) were matching elapsed time goals because topic field was blank.

**Solution**: Explicit template-to-goal assignment system with **bidirectional relationships**:
- Goals can have preferred templates assigned
- Templates track which goals use them
- System checks explicit assignments FIRST, then falls back to fuzzy matching

## Architecture

### Database Schema Changes

#### Goal Interface (`src/types/iep.ts`)
```typescript
export interface Goal {
  // ... existing fields ...
  
  // NEW: Template connections - Explicit template assignment
  preferredTemplateIds?: string[] // Array of template IDs to use for this goal
  
  // ... existing fields ...
}
```

#### GoalTemplate Interface (`src/types/iep.ts`)
```typescript
export interface GoalTemplate {
  // ... existing fields ...
  
  // NEW: Goal connections - Track which goals use this template
  linkedGoalIds?: string[] // Array of goal IDs that have this template assigned
  
  // ... existing fields ...
}
```

### Selection Priority

**File**: `src/services/goalQuestionGenerator.ts` → `findMatchingTemplate()`

```
STEP 1: Check goal.preferredTemplateIds
  ├─ If exists: Try each templateId in order
  ├─ Load from database
  ├─ Check if active
  ├─ Return first active match
  └─ Log: "✅ Using explicitly assigned template"
  
STEP 2: Fuzzy Matching (if no preferred templates or all inactive)
  ├─ Score all active templates
  ├─ Match on: area, topic, subject, grade, operations
  ├─ Return best match if score >= 15
  └─ Log: "✨ Found matching template via fuzzy matching"
  
STEP 3: Fall Back to Hard-Coded Templates
  └─ Use generated templates (elapsed time, money, fractions, etc.)
```

## How It Works

### Scenario 1: Explicit Assignment (Preferred)

1. Teacher creates/edits Goal: "Elapsed Time Word Problems"
2. Teacher clicks "Assign Template" → Selects template
3. System saves `goal.preferredTemplateIds = ["template123"]`
4. When generating PA:
   - System checks `preferredTemplateIds` first
   - Loads template directly from database
   - **GUARANTEED** to use correct template
   - No fuzzy matching needed

### Scenario 2: Fuzzy Matching Fallback

1. Goal has NO `preferredTemplateIds` (or all inactive)
2. System scores all active templates:
   - Area of Need match: +10 points
   - Topic match: +15 points
   - Subject match: +5 points
   - Grade level match: +3 points
   - Assessment method: +2 points
   - Has example question: +5 points
   - Operation match: +3 per operation
3. Best match with score >= 15 is used
4. Falls back to hard-coded templates if no good match

### Scenario 3: Multiple Templates (Rotation)

1. Goal has `preferredTemplateIds = ["tmpl1", "tmpl2", "tmpl3"]`
2. System tries templates IN ORDER
3. First active template wins
4. **Future Enhancement**: Could add rotation logic to cycle through templates

## Benefits

### 1. Reliability
- **Explicit assignments = guaranteed correct template**
- No more wrong question types due to fuzzy matching errors
- Teacher has full control

### 2. Flexibility
- Multiple templates per goal (variety/rotation)
- Can override fuzzy matching when needed
- Falls back gracefully if preferred template deleted/deactivated

### 3. Visibility
- Templates know which goals use them (`linkedGoalIds`)
- Can warn before deleting template: "Used by 3 goals"
- Can bulk-update templates and see impact

### 4. Backward Compatibility
- `preferredTemplateIds` is optional
- Existing goals without assignments use fuzzy matching
- No migration required (optional enhancement later)

## Console Logging

New console logs help track template selection:

```typescript
// Explicit assignment
🎯 Goal has 2 preferred template(s). Checking...
✅ Using explicitly assigned template: "Elapsed Time Template" (ID: abc123)

// Fuzzy matching fallback
⚠️  None of the preferred templates are available. Falling back to fuzzy matching...
✨ Found matching template via fuzzy matching: "Money Problems" (score: 23)

// No match
📋 No matching template found (best score: 8). Using coded templates.
```

## Future UI Enhancements

### Goal Management UI
```
┌─ Goal: "Elapsed Time Word Problems" ─────────────┐
│                                                    │
│ Assigned Templates:                               │
│ ┌────────────────────────────────────────────┐   │
│ │ 1. ✅ Elapsed Time Template (Active)       │   │
│ │ 2. ✅ Time Calculation Template (Active)   │   │
│ │                                             │   │
│ │ [+ Add Template]  [Remove]  [Reorder]      │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ Fuzzy Matching Preview:                           │
│ └─ If no templates assigned, would match:         │
│    "Elapsed Time Template" (score: 28)            │
│                                                    │
│ [Generate Assessment]                              │
└────────────────────────────────────────────────────┘
```

### Template Management UI
```
┌─ Template: "Elapsed Time Template" ───────────────┐
│                                                    │
│ Used by Goals (3):                                 │
│ ├─ Mikah - Elapsed Time Word Problems             │
│ ├─ Rose - Time Calculation Practice                │
│ └─ Alex - Finding Elapsed Time                     │
│                                                    │
│ ⚠️  Warning: Deactivating this template will       │
│    affect 3 goals. They will fall back to fuzzy    │
│    matching or hard-coded templates.               │
│                                                    │
│ [Edit] [Deactivate] [View Goals]                   │
└────────────────────────────────────────────────────┘
```

## Implementation Status

### ✅ Completed
- [x] Add `preferredTemplateIds` to Goal interface
- [x] Add `linkedGoalIds` to GoalTemplate interface
- [x] Update `findMatchingTemplate()` to check preferred templates first
- [x] Add console logging for tracking
- [x] No linter errors

### 🔄 TODO (Next Steps)
- [ ] Add UI for assigning templates to goals
  - [ ] Template selector dropdown in Goal edit form
  - [ ] Multi-select for multiple templates
  - [ ] Reorder/remove templates
- [ ] Add UI for viewing goal usage in Template Management
  - [ ] Show `linkedGoalIds` count
  - [ ] Link to goals that use template
  - [ ] Warning before deactivate/delete
- [ ] Optional: Auto-update `linkedGoalIds` when assigning templates
  - [ ] Add to template's `linkedGoalIds` when assigned to goal
  - [ ] Remove from template's `linkedGoalIds` when unassigned
- [ ] Optional: Template rotation logic
  - [ ] Cycle through `preferredTemplateIds` instead of always using first
  - [ ] Track which template was used last
- [ ] Migration script (optional)
  - [ ] Auto-assign templates based on current fuzzy matching
  - [ ] Review and approve before saving

## Testing

### Test Case 1: Explicit Assignment Works
```
1. Create goal: "Elapsed Time Word Problems"
2. Assign template: "Elapsed Time Template"
3. Generate PA
4. ✅ Verify: Uses "Elapsed Time Template" (not money template)
5. ✅ Check console: "✅ Using explicitly assigned template"
```

### Test Case 2: Fallback to Fuzzy Matching
```
1. Create goal with NO preferred templates
2. Generate PA
3. ✅ Verify: Uses fuzzy matching
4. ✅ Check console: "✨ Found matching template via fuzzy matching"
```

### Test Case 3: Inactive Template Handling
```
1. Create goal with preferred template
2. Deactivate the template
3. Generate PA
4. ✅ Verify: Falls back to fuzzy matching or hard-coded
5. ✅ Check console: "⏭️  Skipping inactive template"
```

### Test Case 4: Multiple Templates
```
1. Assign 3 templates to goal
2. Deactivate template #1
3. Generate PA
4. ✅ Verify: Uses template #2
5. ✅ Check console: Shows trying each template in order
```

## Related Files

- `src/types/iep.ts` - Interface definitions
- `src/services/goalQuestionGenerator.ts` - Template matching logic
- `src/firebase/templateServices.ts` - Template database operations (getTemplate, etc.)

## Notes

- **Bidirectional relationships** (Goal → Template, Template → Goal) provide flexibility
- `preferredTemplateIds` on Goal is the **source of truth** for assignments
- `linkedGoalIds` on Template is for **reference/UI only** (optional to maintain)
- System is **backward compatible** - works with existing goals/templates
- Fuzzy matching is still valuable as fallback and for auto-suggestions



