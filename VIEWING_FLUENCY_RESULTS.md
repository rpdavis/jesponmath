# Where to View Math Fluency Results

## Quick Answer

**Route**: `/diagnostic/results`

**Or from Teacher Dashboard**: Scroll down → Click "Diagnostic Results" card

---

## 📊 What You Can See

The **Diagnostic Results** page now shows **4 types** of Math Fluency data:

### **1. Initial Diagnostics** (Baseline)
**Filter**: Select "All Types" or specific student

**Shows**:
- Student name
- Operation (addition/subtraction/mult/div)
- Proficiency percentage (e.g., 73%)
- Total problems tested (e.g., 120)
- Problems correct
- Date completed

**Details**:
- Problem banks distribution
- Which facts in each proficiency level
- Baseline established

---

### **2. Weekly Fluency Assessments** (Friday Paper Checks)
**Filter**: Select "Math Fluency Assessments (Weekly)"

**Shows For Each Assessment**:
- Student name
- Operation
- **CPM (Correct Per Minute)** - e.g., 28 CPM
- **Fluency Level** - Mastered/Proficient/Developing/Emerging
- **Growth from last week** - e.g., +6 CPM
- Accuracy percentage
- Problems attempted/correct
- Date administered

**Details**:
- Week number
- Assessment name
- Weak fact families (if detailed entry)
- Teacher notes

---

### **3. Daily Practice Sessions** (Mon-Thu Practice)
**Filter**: Select "Math Fluency Practice (Daily)"

**Shows For Each Session**:
- Student name
- Operation
- **Facts learned** (Round 1 count)
- **Session quality** (Excellent/Good/Fair)
- **Practice accuracy** (Round 2 percentage)
- Total time spent
- Date practiced

**Details**:
- Round 1: Which facts learned
- Round 2: Practice results
- Round 3: Assessment results
- Problems promoted

---

### **4. Current Progress** (Real-Time Status)
**Filter**: Leave as "All Types" or select student

**Shows**:
- Operation
- **Current proficiency percentage** (e.g., 73%)
- Facts mastered/proficient/approaching/emerging/unknown
- Last assessment score (CPM)
- Last practice date
- Unlock status (ready for next operation?)

---

## 🔍 How to Access

### **Method 1: From Teacher Dashboard**
```
1. Login as teacher
2. Scroll down to "Quick Actions"
3. Click "Diagnostic Results" card
4. Page loads with all diagnostic results
```

### **Method 2: Direct URL**
```
Navigate to: /diagnostic/results
```

### **Method 3: From Main Menu** (if you have one)
```
Diagnostics → Diagnostic Results
```

---

## 📋 Using the Results Page

### **View All Fluency Data**:
```
1. Go to /diagnostic/results
2. Diagnostic Type: "All Types" (shows everything)
3. Student: "All Students" (or select one)
4. Click 🔄 Refresh
5. Scroll through results
```

**You'll see**:
- All initial diagnostics
- All Friday assessments
- All practice sessions
- Current progress snapshots

**Each card shows**:
- Student name
- Type (e.g., "Daily Practice - addition")
- Score/accuracy
- Date
- Key metrics based on type

---

### **View Specific Student**:
```
1. Go to /diagnostic/results
2. Student dropdown: Select "Almeida, Rose"
3. Diagnostic Type: "All Types"
4. See all Rose's fluency data:
   ├─ Initial diagnostic (baseline)
   ├─ All Friday assessments (week-by-week)
   ├─ All practice sessions (daily logs)
   └─ Current progress (up-to-date status)
```

---

### **View Just Friday Assessments**:
```
1. Go to /diagnostic/results
2. Diagnostic Type: "Math Fluency Assessments (Weekly)"
3. See all Friday fluency checks for all students
4. Shows:
   - CPM scores
   - Week-over-week growth
   - Fluency levels
```

---

### **View Just Practice Sessions**:
```
1. Go to /diagnostic/results  
2. Diagnostic Type: "Math Fluency Practice (Daily)"
3. See all daily practice sessions
4. Shows:
   - Facts learned
   - Session quality
   - Time spent
```

---

## 📊 Example Result Cards

### **Initial Diagnostic Result**:
```
┌──────────────────────────────────────────┐
│ Almeida, Rose                            │
│ Fluency Assessment - addition            │
│ ✅ Complete             73%              │
├──────────────────────────────────────────┤
│ 📅 Nov 18, 2025                          │
│ 📝 120 questions                         │
│ ✅ 88/120 correct                        │
└──────────────────────────────────────────┘
```

### **Friday Assessment Result**:
```
┌──────────────────────────────────────────┐
│ Almeida, Rose                            │
│ Fluency Assessment - addition            │
│ ✅ Complete             87%              │
├──────────────────────────────────────────┤
│ 📅 Nov 22, 2025 (Week 3)                │
│ 📝 32 attempted                          │
│ ✅ 28 correct                            │
│                                          │
│ CPM: 28                                  │
│ Level: Developing                        │
│ Growth: +6 CPM                           │
└──────────────────────────────────────────┘
```

### **Daily Practice Result**:
```
┌──────────────────────────────────────────┐
│ Almeida, Rose                            │
│ Daily Practice - addition                │
│ ✅ Complete             85%              │
├──────────────────────────────────────────┤
│ 📅 Nov 20, 2025                          │
│ 📝 28 problems (3+15+10)                │
│ ✅ 12/15 practice correct (80%)         │
│                                          │
│ Facts Learned: 2                         │
│ Session Quality: Good                    │
│ Time: 11 min                             │
└──────────────────────────────────────────┘
```

---

## 💾 Alternative: Direct Firestore Access

If you need to see raw data:

### **Firebase Console**:
```
1. Go to: https://console.firebase.google.com
2. Select project: jepsonmath
3. Click: Firestore Database
4. Browse collections:
```

**Collections to Check**:

**`mathFluencyProgress`** (Current student status):
- Document ID: `{studentUid}_addition` (etc.)
- Shows: Proficiency distribution, problem banks, unlock status
- Updated: After every practice session

**`mathFluencyAssessments`** (Friday weekly checks):
- Document ID: Auto-generated
- Shows: CPM, accuracy, growth, weak fact families
- Updated: When teacher enters Friday scores

**`mathFluencyPracticeSessions`** (Daily practice logs):
- Document ID: Auto-generated
- Shows: All 3 rounds, facts learned, session quality
- Updated: After each daily practice completion

**`mathFluencyDiagnosticProgress`** (Resume data):
- Document ID: `{studentUid}_{operation}_initial`
- Shows: Saved answers, current position
- Updated: During diagnostic (for resume)
- Deleted: When diagnostic fully completed

---

## 📈 What Data Is Tracked

### **For Each Student**:

**Initial Diagnostic** (Week 0):
- ✅ All 120 problems tested
- ✅ Proficiency level per problem
- ✅ Response time per problem
- ✅ Initial distribution (Mastered/Proficient/etc.)

**Daily Practice** (Mon-Thu):
- ✅ Which facts practiced each day
- ✅ Facts learned (moved to emerging)
- ✅ Facts promoted (moved up levels)
- ✅ Session quality and time
- ✅ Streak tracking

**Friday Assessments** (Weekly):
- ✅ CPM (correct per minute) - primary metric
- ✅ Accuracy percentage
- ✅ Week-over-week growth
- ✅ Weak fact families identified
- ✅ Optional: Specific errors

**Overall Progress**:
- ✅ Proficiency percentage (toward 95% goal)
- ✅ Facts in each bucket
- ✅ Consecutive practice days (streak)
- ✅ Unlock status for next operation

---

## 🎯 Coming in Phase 4 (Better Dashboards)

**Planned**:
- Dedicated fluency dashboard (`/fluency/dashboard`)
- Student detail view with charts (`/fluency/student/{id}`)
- IEP report generator (`/fluency/iep-report/{id}`)
- Weekly trend graphs
- Fact family analysis
- Class-wide analytics

**For Now**:
- Use `/diagnostic/results` with filters
- Or check Firestore directly
- All data is being collected correctly

---

## Quick Access Summary

| What You Want to See | Where to Go | Filter Settings |
|---------------------|-------------|-----------------|
| **All fluency data** | `/diagnostic/results` | Type: "All Types" |
| **Baseline diagnostics** | `/diagnostic/results` | Type: "All Types", look for "Initial" |
| **Friday assessments** | `/diagnostic/results` | Type: "Math Fluency Assessments (Weekly)" |
| **Daily practice** | `/diagnostic/results` | Type: "Math Fluency Practice (Daily)" |
| **One student's data** | `/diagnostic/results` | Student: Select name |
| **Raw data** | Firebase Console | Firestore Database |

---

## ✅ Current Status

**Data Collection**: ✅ Fully functional
- Initial diagnostics save to `mathFluencyProgress`
- Friday assessments save to `mathFluencyAssessments`
- Daily practice saves to `mathFluencyPracticeSessions`

**Viewing**: ✅ Basic viewing available
- `/diagnostic/results` shows all data
- Filter by type and student
- Shows key metrics

**Advanced Reporting**: ⏳ Phase 4
- Dedicated dashboards
- Charts and graphs
- IEP-ready reports

---

**To view results now**: Go to `/diagnostic/results` and select filters!




