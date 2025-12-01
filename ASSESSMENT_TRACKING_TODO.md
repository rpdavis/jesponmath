# Assessment Tracking Implementation - TODO for Next Session

## 🎯 What Needs to Be Built

Based on your requirements, here's the complete implementation plan:

---

## 1. Paper Assessment Save Workflow

### **After Generation → Save Button**

**UI Changes** (`MathFluencyPaperAssessment.vue`): ✅ STARTED
```typescript
// Added:
const assessmentsSaved = ref(false)

// UI:
<button @click="saveAssessments">
  💾 Save Assessments to Database
</button>
```

**Function to Implement:**
```typescript
async function saveAssessments() {
  // For each generated assessment:
  // 1. Get student's assessment count (for numbering)
  // 2. Generate name: "Ryan Davis_Assessment1_11/29/25"
  // 3. Get sub-level name: "Addition ≤10" or "Addition Bridging"
  // 4. Update the existing templateId with this info
  // 5. Mark as "ready-for-scoring"
  
  for (const assessment of generatedAssessments.value) {
    const count = await getAssessmentCountForStudent(assessment.studentUid)
    const date = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: '2-digit'
    })
    
    const assessmentNumber = count + 1
    const uniqueName = `${assessment.studentName}_Assessment${assessmentNumber}_${date}`
    
    // Update the template with final name and metadata
    await updateDoc(doc(db, 'mathFluencyPaperAssessments', assessment.templateId), {
      assessmentName: uniqueName,
      assessmentNumber,
      generatedDate: Timestamp.now(),
      subLevelContext: assessment.subLevelName,
      status: 'ready-for-scoring'
    })
  }
  
  assessmentsSaved.value = true
  alert(`✅ Saved ${generatedAssessments.value.length} assessments!`)
}
```

---

## 2. Get Sub-Level Name During Generation

**Update `generateAssessments()`:**
```typescript
// After getting student progress:
const progress = await getFluencyProgress(student.uid, selectedOperation.value)

// Get sub-level name for display:
let subLevelName = 'Unknown Level'
if (progress && progress.currentSubLevel) {
  const config = getSubLevelConfig(progress.currentSubLevel)
  if (config) {
    subLevelName = config.name  // e.g., "Addition Within 10"
    
    // Make it more descriptive:
    if (config.shortName) {
      subLevelName = config.shortName  // e.g., "Add ≤10"
    }
  }
}

// Add to generated assessment:
generatedAssessments.value.push({
  ...assessment,
  subLevelName  // NEW
})
```

---

## 3. Service Function - Get Assessment Count

**Add to `mathFluencyServices.ts`:**
```typescript
/**
 * Get count of saved assessments for a student
 * Used for auto-numbering (Assessment1, Assessment2, etc.)
 */
export async function getAssessmentCountForStudent(
  studentUid: string
): Promise<number> {
  try {
    const q = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('studentUid', '==', studentUid)
    )
    const snapshot = await getDocs(q)
    return snapshot.size
  } catch (error) {
    console.error('Error getting assessment count:', error)
    return 0
  }
}

/**
 * Get all saved assessments for a student
 */
export async function getStudentPaperAssessments(
  studentUid: string
): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'mathFluencyPaperAssessments'),
      where('studentUid', '==', studentUid),
      orderBy('generatedDate', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting student assessments:', error)
    return []
  }
}
```

---

## 4. Score Entry Page Updates

### **Current State:**
- Load from template (if coming from paper assessment)
- Manual student selection
- Manual problem input

### **Needed State:**
```typescript
// Score Entry Page (`MathFluencyScoreEntry.vue`)
const scoreEntryMode = ref<'student' | 'class'>('student')
const selectedStudentUid = ref('')
const studentAssessments = ref<any[]>([])
const selectedAssessmentId = ref('')
```

### **UI Updates:**
```vue
<!-- Mode Toggle (optional - default to student) -->
<div class="mode-selector">
  <button 
    @click="scoreEntryMode = 'student'" 
    :class="{ active: scoreEntryMode === 'student' }">
    By Student
  </button>
</div>

<!-- Student Selection -->
<div v-if="scoreEntryMode === 'student'">
  <label>Select Student:</label>
  <select v-model="selectedStudentUid" @change="loadStudentAssessments">
    <option value="">-- Choose Student --</option>
    <option v-for="student in students" :value="student.uid">
      {{ student.lastName }}, {{ student.firstName }}
    </option>
  </select>
  
  <!-- Assessment Selection (after student chosen) -->
  <div v-if="studentAssessments.length > 0">
    <label>Select Assessment:</label>
    <select v-model="selectedAssessmentId" @change="loadAssessment">
      <option value="">-- Choose Assessment --</option>
      <option v-for="assessment in studentAssessments" :value="assessment.id">
        {{ assessment.assessmentName }} ({{ assessment.subLevelContext }})
      </option>
    </select>
  </div>
</div>
```

### **Functions to Add:**
```typescript
async function loadStudentAssessments() {
  if (!selectedStudentUid.value) return
  
  studentAssessments.value = await getStudentPaperAssessments(selectedStudentUid.value)
  
  // Filter to only show unscored or ready-for-scoring
  studentAssessments.value = studentAssessments.value.filter(a => 
    a.status === 'ready-for-scoring' || a.status === 'pending-score-entry'
  )
}

async function loadAssessment() {
  if (!selectedAssessmentId.value) return
  
  const template = await getPaperAssessmentTemplate(selectedAssessmentId.value)
  if (template) {
    // Pre-fill the score entry form
    currentAssessmentProblems.value = template.problems
    // Set all as correct initially (teacher marks wrong ones)
  }
}
```

---

## 5. Display Sub-Level Context

### **On Paper Assessment Preview:**
Show what sub-level the test covers:
```
📄 Ryan Davis
   Operation: Addition
   Sub-Level: Addition Within 10
   Problems: 37
   [Download PDF] [Print]
```

### **On Score Entry:**
```
Student: Davis, Ryan
Assessment: Ryan Davis_Assessment1_11/29/25
Context: Addition ≤10 (Sub-level 1/3)
Problems: 37 (pre-filled as correct ✅)
```

---

## 6. Unique Assessment Names

### **Format:**
`{StudentName}_Assessment{#}_{MM/DD/YY}`

### **Examples:**
- `Ryan Davis_Assessment1_11/29/25`
- `Ryan Davis_Assessment2_12/06/25`
- `Sarah Smith_Assessment1_11/29/25`

### **Logic:**
1. Count existing assessments for student: `count = 2`
2. New number: `count + 1 = 3`
3. Date: `new Date().toLocaleDateString()`
4. Combine: `${name}_Assessment${number}_${date}`

**Ensures uniqueness:** Student name + number + date

---

## 🔧 Implementation Steps

### **Step 1: Service Functions** (30 min)
- [ ] `getAssessmentCountForStudent()`
- [ ] `getStudentPaperAssessments()`
- [ ] `updatePaperAssessmentTemplate()` (add metadata)
- [ ] `saveBatchAssessments()` (optional - for atomic saves)

### **Step 2: Paper Assessment Save** (45 min)
- [x] Add "Save Assessment" button ✅
- [x] Add `assessmentsSaved` state ✅
- [ ] Implement `saveAssessments()` function
- [ ] Get sub-level name during generation
- [ ] Generate unique names
- [ ] Update templates with names/metadata

### **Step 3: Score Entry Updates** (45 min)
- [ ] Add student dropdown
- [ ] Load student assessments on select
- [ ] Add assessment dropdown
- [ ] Load template on assessment select
- [ ] Show sub-level context
- [ ] Pre-fill problems from template

### **Step 4: Display Improvements** (30 min)
- [ ] Show sub-level on paper assessment preview
- [ ] Show assessment context in score entry
- [ ] Add "Previously Saved" section to paper assessment page
- [ ] Color-code by status (ready, scored, cancelled)

---

## 📊 Data Structure

### **Updated Template:**
```typescript
{
  studentUid: string
  studentName: string
  operation: OperationType
  assessmentName: string  // Auto-generated unique name
  assessmentNumber: number  // 1, 2, 3...
  subLevelContext: string  // "Addition ≤10"
  currentSubLevel: SubLevel  // "addition_within_10"
  generatedDate: Timestamp
  problems: [...],
  status: 'ready-for-scoring' | 'scored' | 'cancelled'
  ...
}
```

---

## 🎯 Estimated Time

**Total: 2.5 - 3 hours**

1. Service functions: 30 min
2. Save workflow: 45 min
3. Score entry UI: 45 min
4. Display polish: 30 min
5. Testing & fixes: 30 min

---

## ✅ Session Progress

**Completed:**
- Added Save button UI ✅
- Added assessmentsSaved state ✅
- Fixed student detail messaging ✅
- Fixed paper assessment permissions ✅
- Cleaned up debug logging ✅

**Next Session:**
- Implement save function
- Get sub-level names
- Update score entry page
- Add assessment dropdown

---

**Status:** Ready to implement in next focused session!

This is the final piece to make the fluency system **100% complete**! 🚀


