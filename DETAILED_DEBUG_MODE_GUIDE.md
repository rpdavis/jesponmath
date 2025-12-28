# Detailed Debug Mode - Complete Usage Guide

## Overview
Debug mode provides comprehensive session-by-session tracking for selected students to validate the fluency module and catch issues early.

---

## 🚀 Quick Start

### Step 1: Enable Debug Mode for Students

**Navigate to**: `/fluency/debug-manager`

**Process**:
1. Select 2-3 students with different skill levels:
   - 1 high performer (90%+ proficiency)
   - 1 moderate student (70-85% proficiency)
   - 1 struggling student (<70% proficiency)
2. Click "Enable Debug Mode" for each
3. ✅ They're now being tracked!

---

### Step 2: Have Students Complete Sessions

**Normal Practice**:
- Students complete sessions as usual
- No difference in their experience
- System logs everything in background

**While They Practice**:
- Open browser DevTools (F12)
- Watch detailed logs appear in console
- See real-time decisions and calculations

---

### Step 3: Review Logs

**Option A: In Debug Manager** `/fluency/debug-manager`
- Click "View Logs" next to student name
- See session-by-session summary in modal
- Review proficiency changes, scores, advancements

**Option B: In Browser Console**
```javascript
import { printAnalysis, getDetailedLogs } from '@/utils/detailedDebugLogger'

// View analysis summary
printAnalysis('studentUid')

// View all sessions
getDetailedLogs('studentUid')
```

---

### Step 4: Export Data

**In Debug Manager**:
- Click "Export CSV" next to student name
- Downloads 2 CSV files:
  - `StudentName_sessions.csv` - Session summaries
  - `StudentName_problems.csv` - Every problem attempted

**In Console**:
```javascript
import { exportDetailedLogsToCSV, downloadDetailedCSV } from '@/utils/detailedDebugLogger'

const csv = exportDetailedLogsToCSV('studentUid')
downloadDetailedCSV(csv, 'student-debug.csv')
```

---

## 📊 What Gets Logged

### Per Session:

#### 1. Start State
- Proficiency percentage
- Mastery percentage
- Problem bank distribution (doesNotKnow, emerging, approaching, proficient, mastered)
- Consecutive practice days
- Total sessions completed

#### 2. Diagnostic Round (20 problems)
- **Every problem**:
  - Problem ID (e.g., `7_addition_8`)
  - Display text (e.g., `7 + 8 = ?`)
  - Student answer
  - Correct answer
  - Correct/incorrect
  - Response time (ms)
  - Timestamp
- Score (e.g., 18/20)
- Percentage (90%)
- Average response time

#### 3. Round 1 (Learning) - If Applicable
- Whether skipped (perfect diagnostic)
- Problems targeted
- For each problem:
  - Problem ID and display
  - Phase (encoding, consolidation, recall, feedback)
  - Student answer
  - Correct answer
  - Response time
  - Timestamp

#### 4. Round 2 (Practice)
- Fast-track mode (yes/no)
- Problem distribution:
  - Current level: X problems
  - Maintenance: Y problems
  - Total: Z problems
- **Every problem**:
  - Problem ID and display
  - Student answer
  - Correct answer
  - Correct/incorrect
  - Response time
  - **Proficiency before**: doesNotKnow/emerging/approaching/proficient/mastered
  - **Proficiency after**: doesNotKnow/emerging/approaching/proficient/mastered
  - Timestamp
- Score, percentage

#### 5. Round 3 (Quick Check)
- **Every problem**:
  - Same details as diagnostic
- Score, percentage

#### 6. End State
- Proficiency percentage (after session)
- Mastery percentage (after session)
- Problem bank distribution (after session)
- **Proficiency change**: +5% or -2%
- Problems promoted (e.g., emerging → approaching)
- Problems demoted (e.g., proficient → approaching)

#### 7. Advancement Check
- Checked: yes/no
- Proficiency at check
- Threshold used (75%/80%/85%)
- Mode (fast-track/high-performer/standard)
- Advanced: yes/no
- Previous sub-level
- New sub-level
- Reason

#### 8. Session Summary
- Total duration (seconds)
- Total problems attempted
- Total correct
- Overall accuracy
- Average response time
- Session quality (Excellent/Good/Fair/Needs Improvement)

#### 9. Issues/Errors
- Timestamp
- Type (error/warning/info)
- Message
- Context (full error object)

---

## 🔍 Console Log Format

### When Session Starts:
```
🔬 DEBUG SESSION START: John Doe
  Session: 1
  Operation: addition
  Current Level: addition_within_10
  Starting Proficiency: 0%
  ┌─────────────┬────┐
  │ doesNotKnow │ 36 │
  │ emerging    │ 0  │
  │ approaching │ 0  │
  │ proficient  │ 0  │
  │ mastered    │ 0  │
  └─────────────┴────┘
```

### When Session Completes:
```
🔬 DEBUG SESSION COMPLETE: John Doe
  Session: 1
  Duration: 9 minutes
  
  📊 Performance
    Diagnostic: 18/20 (90%)
    Round 2: 14/15 (93%)
    Round 3: 9/10 (90%)
    Overall Accuracy: 91%
    Avg Response Time: 2.3s
  
  📈 Proficiency Change
    Before: 0%
    After: 42%
    Change: +42%
    Problems Promoted: 18
    Problems Demoted: 0
  
  🏆 Bank Distribution Change
    Before: {doesNotKnow: 36, emerging: 0, ...}
    After: {doesNotKnow: 2, emerging: 16, approaching: 18, ...}
  
  🚀 Advancement Check
    Proficiency: 42%
    Threshold: 85%
    Mode: standard
    Advanced: NO
  
  Session Quality: Excellent
  Fast-Track Mode: NO
```

---

## 📈 Analysis Console Commands

### View Student Progression Analysis
```javascript
import { printAnalysis } from '@/utils/detailedDebugLogger'
printAnalysis('studentUid')
```

**Output**:
```
🔬 DETAILED ANALYSIS: John Doe
  Total Sessions: 5
  Average Accuracy: 87%
  Proficiency Growth: +45%
    Start: 0%
    End: 45%
  Advancements: 0
  Fast-Track Sessions: 0
  Issues Encountered: 0
  Avg Session Duration: 9 minutes
  Problems Promoted: 18
  Problems Demoted: 2
```

### View All Sessions
```javascript
import { getDetailedLogs } from '@/utils/detailedDebugLogger'
const logs = getDetailedLogs('studentUid')
console.table(logs.map(l => ({
  Session: l.sessionNumber,
  Level: l.currentSubLevel,
  Proficiency: `${l.startState.proficiencyPercentage}% → ${l.endState.proficiencyPercentage}%`,
  Diagnostic: `${l.diagnostic.score}/${l.diagnostic.total}`,
  Advanced: l.advancement.advanced ? 'Yes' : 'No'
})))
```

### View Specific Session
```javascript
const logs = getDetailedLogs('studentUid')
const session3 = logs[2] // Third session (0-indexed)
console.log(session3)
```

---

## 📁 CSV Export Format

### sessions.csv
```
Session,Date,Operation,Sub-Level,Proficiency Start,Proficiency End,Change,Diagnostic Score,Round 2 Score,Round 3 Score,Overall Accuracy,Fast-Track,Advanced,New Level,Problems Promoted,Problems Demoted,Issues,Duration (min)
1,2025-01-15T10:30:00Z,addition,addition_within_10,0%,42%,+42%,18/20,14/15,9/10,91%,No,No,N/A,18,0,0,9
2,2025-01-16T10:30:00Z,addition,addition_within_10,42%,68%,+26%,19/20,15/15,10/10,98%,No,No,N/A,12,0,0,8
3,2025-01-17T10:30:00Z,addition,addition_within_10,68%,89%,+21%,20/20,15/15,10/10,100%,Yes,Yes,addition_within_20,8,0,0,7
```

### problems.csv
```
Session,Round,Problem ID,Display,Student Answer,Correct Answer,Correct,Response Time (ms),Proficiency Before,Proficiency After
1,Diagnostic,7_addition_8,7 + 8 = ?,15,15,Yes,2340,doesNotKnow,N/A
1,Round 2,7_addition_8,7 + 8 = ?,15,15,Yes,1890,doesNotKnow,emerging
1,Round 3,7_addition_8,7 + 8 = ?,15,15,Yes,1650,emerging,N/A
2,Diagnostic,7_addition_8,7 + 8 = ?,15,15,Yes,1420,emerging,N/A
2,Round 2,7_addition_8,7 + 8 = ?,15,15,Yes,1180,emerging,approaching
```

---

## 🎯 What to Look For

### ✅ Good Signs:
1. **Proficiency increases** session over session
2. **Problems promote** from doesNotKnow → emerging → approaching → proficient → mastered
3. **Advancement triggers** at 85% (or 80%/75% for high performers)
4. **Fast-track activates** for 90%+ students
5. **No issues** in the issues array
6. **Response times** decrease as problems become familiar

### ⚠️ Warning Signs:
1. **Proficiency decreases** multiple sessions in a row
2. **Problems demote** frequently
3. **Advancement doesn't trigger** at 85%+ proficiency
4. **Fast-track doesn't activate** for 90%+ students
5. **Issues array has errors**
6. **Empty problem banks** (should never happen)

### 🔴 Critical Issues:
1. **Proficiency stuck** at same percentage for 3+ sessions
2. **All problems in doesNotKnow** after multiple sessions
3. **Advancement triggers below threshold** (e.g., advances at 70%)
4. **Crashes or errors** in issues array
5. **Response times increasing** (should decrease with practice)

---

## 🧪 Recommended Testing Plan

### Week 1: Enable Debug for 3 Students
**Students**:
- **Alex** (High performer, diagnostic 95%+)
- **Maria** (Moderate, diagnostic 80-90%)
- **Jordan** (Struggling, diagnostic <70%)

**Track**:
- Enable debug mode for all 3
- Have them complete 3-5 sessions each
- Review logs after each session
- Export to CSV at end of week

---

### Week 2: Analyze Results
**Questions to Answer**:
1. Did Alex skip levels correctly?
2. Did Alex get fast-track mode?
3. Did Maria skip level 1?
4. Did Jordan get appropriate support?
5. Are all students advancing appropriately?
6. Any retention issues for accelerated students?

---

### Week 3: Adjust if Needed
Based on Week 2 analysis:
- Adjust thresholds if needed
- Fix any identified issues
- Disable debug for test students
- Enable for full class if validated

---

## 🔧 Console Helper Functions

### Quick Reference Card
```javascript
// Import helpers (in browser console)
import * as debugLogger from '@/utils/detailedDebugLogger'

// Enable/disable
debugLogger.enableDebugMode('studentUid')
debugLogger.disableDebugMode('studentUid')

// View who's being tracked
debugLogger.getDebugEnabledStudents()

// Get logs
debugLogger.getDetailedLogs('studentUid')
debugLogger.getLastSessionLog('studentUid')

// Analysis
debugLogger.printAnalysis('studentUid')
debugLogger.analyzeStudentProgression('studentUid')

// Export
const csv = debugLogger.exportDetailedLogsToCSV('studentUid')
debugLogger.downloadDetailedCSV(csv, 'student.csv')

// Clear
debugLogger.clearStudentLogs('studentUid')
debugLogger.clearAllDetailedLogs()

// Help
debugLogger.printDebugCommands()
```

---

## 📋 Checklist for Using Debug Mode

### Before Session:
- [ ] Debug mode enabled for student
- [ ] Browser console open (F12)
- [ ] Console filter set to "All levels"

### During Session:
- [ ] Monitor console for session start log
- [ ] Watch for any warning/error messages
- [ ] Note fast-track activation
- [ ] Observe advancement checks

### After Session:
- [ ] Review session complete log
- [ ] Check proficiency change is positive
- [ ] Verify problems promoted appropriately
- [ ] Look for any issues in log
- [ ] Compare to previous sessions

### End of Week:
- [ ] Run `printAnalysis('studentUid')` for each debug student
- [ ] Export CSV files for all students
- [ ] Review proficiency growth trends
- [ ] Check advancement count is appropriate
- [ ] Validate fast-track sessions match proficiency
- [ ] Document any issues found

---

## 🎯 Example Use Case

### Scenario: Validating Alex (High Performer)

**Day 1 - Placement**:
```
Diagnostic: Addition 96%, Subtraction 95%
Expected: Skip to multiplication
```

**Enable Debug**:
```
/fluency/debug-manager → Select Alex → Enable Debug Mode
```

**Session 1 - Multiplication Level 8**:
```console
🔬 DEBUG SESSION START: Alex
  Session: 1
  Operation: multiplication
  Current Level: multiplication_easy
  Starting Proficiency: 0%
```

**After Session 1**:
```console
🔬 DEBUG SESSION COMPLETE: Alex
  Session: 1
  📊 Performance
    Diagnostic: 18/20 (90%)
    Round 2: 15/15 (100%)
    Round 3: 10/10 (100%)
  📈 Proficiency Change
    Before: 0%
    After: 52%
    Change: +52%
  Session Quality: Excellent
  Fast-Track Mode: NO (not yet at 90%)
```

**After Session 2**:
```console
🔬 DEBUG SESSION COMPLETE: Alex
  Session: 2
  📊 Performance
    Diagnostic: 20/20 (100%)
    Round 2: 15/15 (100%)
    Round 3: 10/10 (100%)
  📈 Proficiency Change
    Before: 52%
    After: 91%
    Change: +39%
  🚀 Advancement Check
    Proficiency: 91%
    Threshold: 80% (High Performer mode)
    Advanced: YES ✅
    From: multiplication_easy
    To: multiplication_medium
  Session Quality: Excellent
  Fast-Track Mode: YES ⚡
```

**Analysis After 5 Sessions**:
```console
🔬 DETAILED ANALYSIS: Alex
  Total Sessions: 5
  Average Accuracy: 97%
  Proficiency Growth: +100% (0% → 100%)
  Advancements: 3
  Fast-Track Sessions: 4
  Issues Encountered: 0
  Avg Session Duration: 7 minutes
  Problems Promoted: 87
  Problems Demoted: 0
```

**✅ Validation**:
- Skipped addition and subtraction ✓
- Started at multiplication ✓
- Fast-track activated after session 2 ✓
- Advanced faster (80% threshold) ✓
- No issues or errors ✓
- **System working correctly for high performers!**

---

## 🐛 Troubleshooting

### Debug Mode Not Logging
**Check**:
1. Is student in `getDebugEnabledStudents()` list?
2. Is console showing `🔬 DEBUG MODE ACTIVE` at session start?
3. Are you using the correct studentUid?

**Fix**:
```javascript
import { getDebugEnabledStudents } from '@/utils/detailedDebugLogger'
getDebugEnabledStudents() // Should include studentUid
```

### Logs Not Showing in Console
**Check**:
1. DevTools open before session starts?
2. Console filter set to "All levels"?
3. Student has completed at least one session?

**Fix**:
- Open DevTools (F12) BEFORE session starts
- Set filter to "Verbose" or "All levels"
- Refresh page if needed

### CSV Export Empty
**Check**:
1. Has student completed any sessions with debug enabled?
2. Are you calling export with correct studentUid?

**Fix**:
```javascript
import { getDetailedLogs } from '@/utils/detailedDebugLogger'
getDetailedLogs('studentUid').length // Should be > 0
```

---

## 📊 Data Analysis Tips

### Spot Check Proficiency Calculations
**In CSV**: Look for sessions where proficiency doesn't change
- If diagnostic 20/20, Round 2 15/15, Round 3 10/10 → Proficiency should increase significantly
- If proficiency stuck → Issue with calculation

### Verify Advancement Logic
**In CSV**: Find sessions where proficiency >= 85%
- Should see "Advanced: Yes" in next row
- If proficiency 87% but no advancement → Threshold issue

### Check Fast-Track Activation
**In CSV**: When proficiency reaches 90%+
- Next session should show "Fast-Track: Yes"
- Problem distribution should change to 80/10/10
- If not activating → Detection issue

### Monitor Problem Promotion
**In problems.csv**: Track individual problems
- Problem should progress: doesNotKnow → emerging → approaching → proficient → mastered
- Should take 5-10 sessions typically
- If stuck in one level → Promotion logic issue

---

## ✅ Success Criteria

After testing with debug mode:

**Placement**:
- [ ] High performers (95%+) skip to appropriate levels
- [ ] Moderate students (85%+) skip level 1
- [ ] All students start at correct sub-level

**Progression**:
- [ ] Proficiency increases session over session
- [ ] Problems promote through levels
- [ ] Advancement triggers at correct threshold (75%/80%/85%)

**Acceleration**:
- [ ] Fast-track activates at 90%+ proficiency
- [ ] High performers get 80% threshold
- [ ] Fast-trackers get 75% threshold
- [ ] Problem distribution adjusts correctly

**Quality**:
- [ ] No errors in issues array
- [ ] No proficiency decreases (unless expected)
- [ ] No empty problem banks
- [ ] Response times decrease with practice

---

## 💡 Pro Tips

1. **Enable debug early**: Turn on debug before student's first session to capture placement
2. **Use presets**: Test simulator with all presets before deploying to students
3. **Export weekly**: Export CSVs every Friday to track trends
4. **Compare students**: Look for patterns across high/medium/low performers
5. **Share logs**: Export and share with team for collaborative analysis

---

*Last Updated: 2025-01-XX*
*Status: ✅ Ready to Use*











