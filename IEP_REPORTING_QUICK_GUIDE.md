# IEP Reporting with Fluency Module - Quick Guide for Teachers

## 🎯 What You Need for IEPs

**IEP Question**: "What is the student's math fluency rate?"

**Answer with Data**:
```
Operation-Specific CPM (Correct Per Minute):
- Addition: 50 CPM (meets 7th grade target)
- Subtraction: 45 CPM (approaching target)
- Multiplication: 12 CPM (below target, needs intervention)
- Division: 10 CPM (below target, needs intervention)
```

**Why This Is Better**:
- ✅ Shows **specific strengths and weaknesses**
- ✅ Explains **why** overall performance varies
- ✅ Provides **measurable, objective data**
- ✅ Identifies **which operations need intervention**

---

## 📊 How to Get CPM Data

### Step 1: Administer Paper Assessments (Fridays)
1. Generate assessment: `/fluency/paper-assessment`
2. Print for students
3. Give 1-minute timed probe in class
4. Count how many they completed correctly = CPM

### Step 2: Enter Scores
1. Navigate to: `/fluency/score-entry`
2. Select student
3. Enter:
   - How many attempted (e.g., 30)
   - Which ones were incorrect (check boxes)
4. System calculates CPM automatically
5. Saves to database

### Step 3: View CPM Report
1. Navigate to: `/fluency/cpm-report`
2. Select student
3. See:
   - Current CPM per operation
   - Growth over time
   - Bottleneck problems (from digital practice)
4. Print for IEP documentation

---

## 💡 Understanding Variation Across Operations

### Example Student: Maria

```
Addition:        50 CPM  ✅ Excellent
Subtraction:     30 CPM  📈 Good
Multiplication:  10 CPM  🔴 Needs Support  
Division:        12 CPM  🔴 Needs Support
Mixed Mult/Div:   8 CPM  🔴 Struggling with switching
```

**What This Tells You**:
1. **Addition fluency is automatic** - student has mastered this operation
2. **Subtraction is developing** - knows facts but not yet automatic
3. **Multiplication is a weakness** - only 25% of target fluency
4. **Division similar to multiplication** - both need work
5. **Mixed operations even lower** - switching between operations slows them down

**NOT just**: "Student struggles with math fluency"  
**INSTEAD**: "Student has mastered addition (50 CPM), developing subtraction (30 CPM), and requires intervention in multiplication/division (10-12 CPM)"

---

## 🎯 The Bottleneck Advantage

### Paper Tells You: Low CPM
```
Paper Assessment Result:
Multiplication: 12/60 attempted in 1 minute
CPM: 12
```

**Question**: Why only 12? Does student not know multiplication?

### Digital Tells You: Which Facts Are Bottlenecks
```
Digital Practice Analysis:
✅ Fluent in 63/66 facts (average 1.8s response)
🔴 Bottlenecks (3 facts):
   - 9×7: 12.3s average (STUCK on this one)
   - 8×6: 8.1s average
   - 7×8: 6.4s average
```

**Answer**: Student knows most facts! Just gets **stuck** on 9×7 during tests, which eats up time and limits how many they can complete.

### Scenario Explained:
```
1-Minute Paper Test:
- Sees 9×7 as problem #3
- Spends 25 seconds trying to figure it out
- Completes 12 problems in remaining 35 seconds
- CPM: 12

Without 9×7 bottleneck:
- Would complete ~30 problems in 60 seconds
- CPM would be: 30
```

### For IEP:
```
Current: Multiplication CPM 12
Target:  Focus intervention on 9×7 fact family
Goal:    Reduce 9×7 response time from 12.3s to <3s
Expected Impact: CPM should increase to 25-30 when bottleneck resolved
Timeline: 6-8 weeks with daily practice
```

---

## 📋 IEP Goal Templates

### Template 1: Increase CPM to Target
```
GOAL: By [date], student will demonstrate multiplication fluency 
of 25 correct facts per minute (from current 12 CPM) as measured 
by weekly 1-minute paper probes.

Progress Monitoring: Weekly paper assessments, tracked in digital system

Current Performance: 12 CPM (30% of 7th grade target)
Target Performance: 25 CPM (63% of target - appropriate for RSP student)
```

### Template 2: Target Specific Bottlenecks
```
GOAL: By [date], student will demonstrate automatic recall (<3 seconds) 
of targeted multiplication facts (9×7, 8×6, 7×8) as measured by digital 
practice response times, increasing overall multiplication CPM from 12 to 25.

Progress Monitoring: 
- Weekly paper assessments for CPM
- Daily digital practice for response times

Current Performance:
- Overall Multiplication CPM: 12
- Bottleneck facts: 9×7 (12.3s), 8×6 (8.1s), 7×8 (6.4s)

Target Performance:
- Overall Multiplication CPM: 25
- Bottleneck facts: All <3s (automatic recall)
```

### Template 3: Cross-Operation Fluency
```
GOAL: By [date], student will demonstrate fluency across all four 
operations with minimum 70% of grade-level targets on CPM:

- Addition: Maintain 50 CPM (100% of target) ✅
- Subtraction: Increase from 30 to 35 CPM (70% of target)
- Multiplication: Increase from 12 to 28 CPM (70% of target)
- Division: Increase from 10 to 25 CPM (70% of target)

Progress Monitoring: Weekly paper assessments per operation
```

---

## 🔍 Interpreting for Parents

### Good News Approach:
```
"Great news - your student is fluent in addition with 50 correct 
per minute! That's at grade level.

For multiplication, they're currently at 12 correct per minute. 
The good news is that our digital practice shows they actually 
know 63 out of 66 multiplication facts. There are just 3 specific 
facts where they get stuck during tests - 9×7, 8×6, and 7×8.

We're targeting those 3 facts with special strategies, and we expect 
their overall rate to jump to 25-30 once those become automatic."
```

### Data-Driven Communication:
```
Instead of: "Student struggles with multiplication"
Use: "Student knows 95% of multiplication facts but has retrieval 
      difficulties with 9×7 fact family, limiting CPM to 12"

Instead of: "Needs more practice"
Use: "Targeted intervention on 9×7, 8×6, 7×8 should increase CPM 
      from 12 to 25-30 within 6-8 weeks"
```

---

## ✅ Quick Access

**Routes**:
- Generate paper assessment: `/fluency/paper-assessment`
- Enter scores: `/fluency/score-entry`
- **View CPM report**: `/fluency/cpm-report` ⭐
- View student progress: `/fluency/teacher-view`

**Workflow**:
1. **Friday**: Generate & administer paper assessment
2. **Friday afternoon**: Enter scores
3. **Friday end-of-day**: Check CPM report for any concerns
4. **Before IEP**: Print CPM report for documentation

---

*Created: 2025-01-XX*
*For: IEP documentation and parent communication*


