# Quarter-Based Assessment Filtering - Implementation Options

**Goal**: Students should only see assessments assigned for their current quarter, with other assessments hidden.

---

## 🔍 Current System Analysis

### How It Works Now

1. **Students view assessments** via `StudentAssessments.vue`
2. **Data flow**:
   ```
   Student logs in
     ↓
   getAssessmentsByStudent(studentUid)
     ↓
   Queries assessmentAssignments table (junction table)
     ↓
   Returns ALL assessments ever assigned to student
     ↓
   Filtered by academic period using dates (assignDate/dueDate)
   ```

3. **Key Data Structures**:
   ```typescript
   // assessmentAssignments (junction table)
   {
     id: string,
     assessmentId: string,
     studentUid: string,
     assignedBy: string,
     assignedAt: Timestamp,    // When assigned
     dueDate?: Timestamp,       // Optional due date
     status: 'assigned' | 'started' | 'completed' | 'overdue',
     // NO academicPeriod field currently!
   }

   // Academic Periods (already defined)
   {
     id: "q1" | "q2" | "q3" | "q4",
     name: "Quarter 1",
     startDate: Date,
     endDate: Date,
     isActive: boolean
   }
   ```

### What's Missing

❌ **No direct link between assignments and quarters**
- Assignments don't store which quarter they belong to
- Current filtering uses date ranges (if assignment date falls within period dates)
- This is imprecise - a teacher might assign an assessment on Oct 30 (Q1) that's due in Nov (Q2)

---

## 📋 Implementation Options

### **Option 1: Add `academicPeriod` Field to Assignments** ⭐ RECOMMENDED

**How it works**: Add an `academicPeriod` field directly to the `assessmentAssignments` table.

#### Changes Required

```typescript
// 1. Update AssessmentAssignment interface
export interface AssessmentAssignment {
  // ... existing fields ...
  academicPeriod?: string;  // NEW: "q1", "q2", "q3", "q4", "s1", "s2", etc.
}

// 2. Update assignment creation (assignmentServices.ts)
export async function bulkAssignAssessment(
  assessmentId: string,
  studentUids: string[],
  assignedBy: string,
  options?: {
    dueDate?: Date;
    academicPeriod?: string;  // NEW: Optional quarter/period
    // ... other options
  }
) {
  // If not provided, auto-detect from current date
  const period = options?.academicPeriod || getCurrentPeriod();
  
  // Store in assignment
  assignmentData.academicPeriod = period;
}

// 3. Update student query (iepServices.ts)
export const getAssessmentsByStudent = async (
  studentUid: string,
  academicPeriod?: string  // NEW: Optional filter
) => {
  let q = query(
    collection(db, 'assessmentAssignments'),
    where('studentUid', '==', studentUid)
  );
  
  // Filter by quarter if provided
  if (academicPeriod) {
    q = query(q, where('academicPeriod', '==', academicPeriod));
  }
  
  // Rest of logic...
}

// 4. Update StudentAssessments.vue
const loadAssessments = async () => {
  const currentPeriod = getCurrentAcademicPeriod(); // e.g., "q2"
  const assessments = await getAssessmentsByStudent(
    studentId,
    currentPeriod.id  // Only fetch current quarter
  );
}
```

#### Database Migration

Need to backfill existing assignments:

```typescript
// Migration script
async function migrateAssignmentPeriods() {
  // For each existing assignment without academicPeriod
  // Infer period from assignedAt date
  // Update assignment.academicPeriod = inferredPeriod
}
```

#### Firestore Index Required

```json
{
  "collectionGroup": "assessmentAssignments",
  "fields": [
    { "fieldPath": "studentUid", "order": "ASCENDING" },
    { "fieldPath": "academicPeriod", "order": "ASCENDING" },
    { "fieldPath": "assignedAt", "order": "DESCENDING" }
  ]
}
```

#### Pros ✅
- **Most accurate** - Teacher explicitly sets the quarter when assigning
- **Fast queries** - Direct Firestore filter (no client-side filtering)
- **Flexible** - Easy to show "all quarters" or switch between quarters
- **Clear intent** - Data explicitly shows which quarter it belongs to
- **Handles edge cases** - Works even if dates are weird (assigned in Q1 for Q3)

#### Cons ❌
- **Requires migration** - Must backfill ~existing assignments
- **UI update needed** - Add quarter selector to assignment creation
- **Small schema change** - Adds one field to database

#### Implementation Time
- **Code changes**: 2-3 hours
- **Migration script**: 1 hour
- **Testing**: 1 hour
- **Total**: ~4-5 hours

---

### **Option 2: Filter by Date Ranges (Client-Side)**

**How it works**: Keep current system, but filter more strictly by comparing assignment dates to quarter dates.

#### Changes Required

```typescript
// StudentAssessments.vue
const filteredAssignments = computed(() => {
  const currentPeriod = getCurrentAcademicPeriod();
  
  return assignedAssessments.value.filter(assessment => {
    // Get assignment record to check date
    const assignment = findAssignment(assessment.id, studentUid);
    
    if (!assignment?.assignedAt) return false;
    
    const assignedDate = assignment.assignedAt.toDate();
    
    // Only show if assigned during current quarter
    return assignedDate >= currentPeriod.startDate && 
           assignedDate <= currentPeriod.endDate;
  });
});
```

#### Pros ✅
- **No database changes** - Works with current schema
- **No migration needed** - Instant implementation
- **Simple logic** - Just compare dates

#### Cons ❌
- **Inaccurate** - Assignment date doesn't always match intended quarter
- **Performance** - Fetches ALL assignments, filters client-side
- **Edge cases** - What about assessments assigned at end of Q1 but due in Q2?
- **Teacher confusion** - "Why can't students see the assessment I just assigned for next quarter?"

#### Implementation Time
- **Code changes**: 30 minutes
- **Testing**: 30 minutes
- **Total**: ~1 hour

---

### **Option 3: Add `academicPeriod` to Assessment (Not Assignment)**

**How it works**: Store quarter on the Assessment itself, not the assignment.

```typescript
export interface Assessment {
  // ... existing fields ...
  academicPeriod?: string;  // "q1", "q2", etc.
}
```

#### Pros ✅
- **Simple** - One field on assessment
- **Fast queries** - Can filter assessments before joining with assignments

#### Cons ❌
- **Inflexible** - Can't assign the same assessment to different quarters
  - Example: Teacher wants to use same assessment in Q2 and Q4 → Must duplicate assessment
- **Breaks reusability** - Assessments become quarter-specific
- **Migration complex** - Existing assessments used across quarters cause issues

#### Implementation Time
- **Not recommended** - Too inflexible for real-world use

---

### **Option 4: Hybrid - Period on Assessment + Override on Assignment**

**How it works**: Assessment has default period, but assignment can override.

```typescript
export interface Assessment {
  defaultAcademicPeriod?: string;  // Default: "q1"
}

export interface AssessmentAssignment {
  academicPeriod?: string;  // Override: "q2" (if different from default)
}

// Logic:
const effectivePeriod = assignment.academicPeriod || assessment.defaultAcademicPeriod;
```

#### Pros ✅
- **Most flexible** - Can reuse assessments OR be specific
- **Best of both worlds** - Default behavior + custom overrides

#### Cons ❌
- **Most complex** - Two places to check
- **Confusing** - Teachers might not understand override system
- **Extra work** - Implementing both Option 1 and Option 3

---

## 🎯 Recommendation: **Option 1** (academicPeriod on Assignment)

### Why Option 1 is Best

1. **Accurate** - Assignment period is explicit, not inferred
2. **Flexible** - Same assessment can be used in multiple quarters
3. **Performant** - Server-side filtering with Firestore index
4. **Intuitive** - Teachers control which quarter when assigning
5. **Standard pattern** - Industry-standard junction table design

### When Students View Different Quarters

```typescript
// StudentAssessments.vue - Add quarter selector

<select v-model="selectedQuarter">
  <option value="current">Current Quarter (Q2)</option>
  <option value="q1">Quarter 1</option>
  <option value="q2">Quarter 2</option>
  <option value="q3">Quarter 3</option>
  <option value="q4">Quarter 4</option>
  <option value="all">All Quarters</option>
</select>

const loadAssessments = async () => {
  const quarter = selectedQuarter.value === 'current' 
    ? getCurrentAcademicPeriod().id 
    : selectedQuarter.value === 'all'
    ? undefined  // No filter
    : selectedQuarter.value;
    
  const assessments = await getAssessmentsByStudent(studentId, quarter);
};
```

---

## 📝 Implementation Checklist (Option 1)

### Phase 1: Schema Updates (1 hour)
- [ ] Add `academicPeriod?: string` to `AssessmentAssignment` interface
- [ ] Update Firestore indexes
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

### Phase 2: Backend Updates (2 hours)
- [ ] Update `assignAssessmentToStudent()` to accept `academicPeriod`
- [ ] Update `bulkAssignAssessment()` to accept `academicPeriod`
- [ ] Auto-detect current period if not provided
- [ ] Update `getAssessmentsByStudent()` to filter by period

### Phase 3: UI Updates (2 hours)
- [ ] Add quarter selector to assignment creation UI
- [ ] Update `StudentAssessments.vue` to filter by current quarter
- [ ] Add "View Other Quarters" dropdown (optional)
- [ ] Update teacher assignment flow to select quarter

### Phase 4: Migration (1 hour)
- [ ] Create migration script
- [ ] Backfill existing assignments:
  - Infer period from `assignedAt` date
  - Set `academicPeriod` field
- [ ] Run migration on production

### Phase 5: Testing (1 hour)
- [ ] Test student can only see current quarter
- [ ] Test teacher can assign to specific quarter
- [ ] Test switching between quarters works
- [ ] Verify performance with large datasets

---

## 🚨 Important Considerations

### 1. **What about past quarters?**

**Question**: Should students see completed assessments from past quarters?

**Options**:
- **A. Hide completely** - Only current quarter visible
- **B. Show completed only** - Past quarter assessments visible if completed
- **C. Read-only view** - Past quarter results viewable but not retakeable

**Recommendation**: **Option B** - Show completed past assessments for review.

```typescript
const assessments = await getAssessmentsByStudent(studentId, {
  period: currentPeriod,
  includeCompleted: true  // Include completed from past periods
});
```

### 2. **What about year-long assessments?**

Some assessments might not belong to a specific quarter:
- Diagnostic assessments
- Placement tests
- Mid-year/End-of-year benchmarks

**Solution**: Use special values:
- `academicPeriod: "all"` - Available all year
- `academicPeriod: null` - No period restriction

### 3. **What about students who transfer mid-year?**

Student joins in Q3 but needs to complete Q2 assessments?

**Solution**: Teacher can assign with past quarter:
```typescript
bulkAssignAssessment(assessmentId, [newStudentUid], teacherUid, {
  academicPeriod: "q2",  // Assign Q2 assessment in Q3
  notes: "Catch-up assignment"
});
```

### 4. **Performance Impact**

Adding `where('academicPeriod', '==', 'q2')` to queries:
- ✅ **Reduces results** - Faster queries (only ~25% of data)
- ✅ **Better UX** - Students not overwhelmed with old assessments
- ⚠️ **Requires index** - Must deploy Firestore composite index

---

## 💡 Quick Start vs. Full Implementation

### Minimal Implementation (1-2 hours)

Just hide old assessments, don't add UI:

```typescript
// 1. Add field to types
export interface AssessmentAssignment {
  academicPeriod?: string;
}

// 2. Update StudentAssessments.vue
const currentPeriod = getCurrentAcademicPeriod();

const filteredAssignments = computed(() => {
  return assignedAssessments.value.filter(a => {
    const assignment = assignments.find(asn => asn.assessmentId === a.id);
    // Include if: no period set (old data) OR matches current period
    return !assignment?.academicPeriod || 
           assignment.academicPeriod === currentPeriod.id;
  });
});

// 3. Update assignment creation (auto-detect period)
const currentPeriod = getCurrentAcademicPeriod();
assignmentData.academicPeriod = currentPeriod.id;
```

**Result**: Students see current quarter + old (unmigrated) assessments.
Over time, as new assessments are assigned, old ones naturally phase out.

### Full Implementation (4-5 hours)

- Complete backend filtering
- UI for quarter selection
- Migration script for existing data
- Teacher controls for assigning to specific quarters

---

## 📊 Summary Comparison

| Option | Accuracy | Performance | Flexibility | Migration | Time |
|--------|----------|-------------|-------------|-----------|------|
| **Option 1: Period on Assignment** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Required | 4-5h |
| Option 2: Date Range Filter | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | None | 1h |
| Option 3: Period on Assessment | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | Required | 3-4h |
| Option 4: Hybrid Approach | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Required | 6-8h |

---

## 🎬 Next Steps

1. **Decide on approach** (Recommendation: Option 1)
2. **Decide on scope**:
   - Minimal (auto-detect, gradual rollout)
   - Full (with migration and UI controls)
3. **Review edge cases** (past quarters, year-long assessments, etc.)
4. **Approve implementation plan**
5. **Begin implementation** 🚀

---

## Questions to Answer Before Implementation

1. Should students be able to view past quarters? (Yes/No/Completed only)
2. Should teachers be able to manually select quarters when assigning? (Recommended: Yes)
3. Should we migrate existing data or let it phase out naturally? (Depends on urgency)
4. What about assessments that span multiple quarters? (Use `academicPeriod: "all"`)
5. Should admin/teachers see all quarters in gradebook? (Recommended: Yes, with filter)

---

**Ready to proceed?** Let me know which option you'd like to implement and I can start coding!


