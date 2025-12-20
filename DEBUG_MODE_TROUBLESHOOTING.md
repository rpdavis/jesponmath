# Debug Mode Troubleshooting

## Issue: No Logs Showing After Student Activity

### What Happened:
1. ✅ Enabled debug mode for student
2. ✅ Student completed activity
3. ❌ No logs appear in Debug Mode Manager

---

## 🔍 Root Cause

**Debug logging is currently only integrated into PRACTICE SESSIONS, not STRATEGY LESSONS**

### What Gets Logged:
✅ **Practice Sessions** (Full session flow):
- Warmup
- Diagnostic round (20 problems)
- Round 1 (Learning)
- Round 2 (Practice - 15 problems)
- Round 3 (Quick check - 10 problems)
- Results and advancement

❌ **Strategy Lessons** (Not logged yet):
- Making 5
- Making 10
- Bridging to 10
- Ten Frames

---

## 🎯 How to Get Logs

### The student needs to complete a **FULL PRACTICE SESSION**:

**What the student sees**:
1. Navigate to `/fluency/daily-practice`
2. Click "Start Practice"
3. **IF lesson required**: Complete lesson first (Making 5, etc.)
4. **THEN**: Practice session starts
   - Warmup (type 3 numbers)
   - Diagnostic (20 problems)
   - Round 1 (learning wrong problems)
   - Round 2 (practice 15 problems)
   - Round 3 (quick check 10 problems)
5. **Session Complete screen**

**When logs are saved**:
- ✅ After Step 5 (session complete)
- ✅ Only if student finished entire session
- ❌ NOT if they only completed lesson
- ❌ NOT if they quit mid-session

---

## 🧪 Test Debug Mode Works

### Quick Test (5 minutes):

1. **Enable debug for yourself** (teacher account):
```
Navigate to /fluency/debug-manager
Select your own name
Click "Enable Debug Mode"
```

2. **Complete a practice session yourself**:
```
Navigate to /fluency/daily-practice
Complete the full session (all rounds)
```

3. **Check for logs**:
```
Go back to /fluency/debug-manager
Click "View Logs" next to your name
You should see 1 session log
```

4. **Check console**:
```
Open DevTools (F12) → Console tab
You should see:
🔬 DEBUG SESSION START: [Your Name]
... session activity ...
🔬 DEBUG SESSION COMPLETE: [Your Name]
  Session: 1
  Duration: X minutes
  📊 Performance...
```

---

## 🔍 Common Scenarios

### Scenario 1: Student Completed Lesson Only
```
What student did:
1. Clicked "Start Practice"
2. Saw "Making 5" lesson popup
3. Completed lesson (5-10 problems)
4. Lesson closed
5. Student stopped

What gets logged: NOTHING
Why: Lesson completion doesn't trigger practice session
Debug only tracks practice sessions, not lessons

What to do: Have student continue to actual practice session
```

### Scenario 2: Student Quit Mid-Session
```
What student did:
1. Started practice
2. Completed diagnostic
3. Quit during Round 2

What gets logged: NOTHING
Why: Logs are only saved when session completes
If student quits early, no log is saved

What to do: Have student complete entire session
```

### Scenario 3: Student Completed Session Yesterday
```
What teacher did:
1. Enabled debug today
2. Checked logs
3. No logs showing

What gets logged: NOTHING
Why: Debug mode wasn't enabled when they practiced
Logs only captured for sessions AFTER debug enabled

What to do: Wait for student to complete a NEW session with debug enabled
```

---

## ✅ How to Know Debug Is Working

### Check 1: Enabled Students List
```
Navigate to: /fluency/debug-manager

Should see:
"Students with Debug Mode Enabled (2)"
- Student Name [🔬 Debugging]
  [View Logs (0)] [Analyze] [Export CSV] [Disable]
```

If student appears in list = Debug enabled ✅

### Check 2: Console During Session
```
1. Open DevTools (F12) → Console
2. Keep it open while student practices
3. At session start, should see:
   🔬 DEBUG MODE ACTIVE for this student
   🔬 DEBUG SESSION START: Student Name
```

If you see these messages = Debug working ✅

### Check 3: Console After Session
```
After student completes session, should see:
🔬 DEBUG SESSION COMPLETE: Student Name
  Session: 1
  Duration: 9 minutes
  📊 Performance
    Diagnostic: 18/20 (90%)
    Round 2: 14/15 (93%)
    ...
```

If you see this = Logs were captured ✅

---

## 🎯 Solution

**To get logs, student must**:
1. ✅ Have debug mode enabled (check in debug manager)
2. ✅ Complete a **full practice session** (not just lesson)
3. ✅ Finish all rounds through "Session Complete" screen
4. ✅ Session must happen AFTER debug was enabled

**Then you will see**:
- Log count increase: "View Logs (1)" → "View Logs (2)"
- Session data in modal when you click "View Logs"
- Detailed console output if DevTools was open

---

## 🔧 Quick Fix: Have Student Do Practice Now

### Tell the student:
```
1. Go to the math fluency practice page
2. Click "Start Today's Practice"
3. If a lesson appears, complete it
4. Continue to the practice rounds
5. Complete ALL rounds (Diagnostic, Round 1, Round 2, Round 3)
6. See the "Session Complete" screen
7. Done!
```

### Then check:
```
/fluency/debug-manager
→ Click "View Logs" next to their name
→ Should now show 1 session
```

---

## 📝 What Each Round Looks Like

### Student Experience:
1. **Warmup**: Type 3 numbers (30 seconds)
2. **Diagnostic**: 20 math problems (3-4 minutes)
3. **Round 1**: Learn wrong problems (0-15 minutes, skipped if perfect)
4. **Round 2**: Practice 15 problems (4-5 minutes)
5. **Round 3**: Quick check 10 problems (2 minutes)
6. **Complete**: See results screen

**Total time**: 8-10 minutes for perfect students, up to 20 minutes if learning new facts

---

## 🐛 Still Not Working?

### Check These:

1. **Is student in the enabled list?**
   ```
   /fluency/debug-manager
   Should see student name under "Students with Debug Mode Enabled"
   ```

2. **Did student complete PRACTICE, not just LESSON?**
   ```
   Lesson = Popup with strategy instruction (5-10 problems)
   Practice = Full session with diagnostic, 3 rounds
   Debug only tracks practice sessions
   ```

3. **Check browser console**:
   ```
   F12 → Console tab
   Look for: "🔬 DEBUG MODE ACTIVE"
   If missing, debug not enabled for that student
   ```

4. **Check localStorage**:
   ```
   F12 → Application tab → Local Storage
   Look for key: "fluency_debug_enabled_students"
   Should contain array with student UIDs
   ```

---

*Last Updated: 2025-01-XX*
*Issue: Debug only tracks practice sessions, not lessons*
*Solution: Student must complete full practice session*








