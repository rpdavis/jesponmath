# Current Math Fluency Practice Flow - Detailed Breakdown

## 🔄 Practice Session Structure

The daily practice is divided into **3 rounds** with different purposes:

---

## 📚 ROUND 1: Learning New Facts

**Purpose**: Introduce 3-5 new facts using spaced repetition encoding

### **Phase 1: Encoding (5 seconds)**
```
"Watch carefully!"
7 + 8 = 15
[5s countdown]
```
- Shows the COMPLETE fact with answer
- Student sees it for 5 seconds
- No interaction required

### **Phase 2: Consolidation (2 seconds)**
```
"Get ready..."
[2s countdown]
```
- Brief pause to consolidate memory
- Prepares student for recall

### **Phase 3: Recall (15 seconds)**
```
"Now you try!"
7 + 8 = ?
[Input field]
[15s countdown timer]
```
- Student must recall and type answer
- Has 15 seconds to respond
- Timer shows seconds remaining (text only)

### **Phase 4: Feedback (Variable)**
**If CORRECT:**
```
✅ Correct!
7 + 8 = 15
[Testing again... OR Moving to next fact...]
[countdown]
```
- Shows they got it right
- First recall → Test again immediately
- Second recall → Move to next fact

**If INCORRECT:**
```
❌ The answer is 15
7 + 8 = 15
Let's see it again...
[countdown]
```
- Shows correct answer
- Loops back to encoding (shows complete fact again)
- Continues until student gets it right twice

### **Round 1 Flow:**
```
Fact 1: Encoding → Consolidation → Recall → Feedback
        → (if wrong) Loop back to Encoding
        → (if right) Recall again
        → (if right 2x) Next fact

Fact 2: [Same process]
Fact 3: [Same process]

→ Move to Round 2
```

---

## 💪 ROUND 2: Mixed Practice

**Purpose**: Interleaved practice with mix of proficiency levels

### **Current Implementation:**
```
Question: 7 + 8 = ?
[Input field]
Timer: 15s
[Submit button]

Immediate Feedback (shows for ~1-2 seconds):
  ✅ "Great! Fast and accurate!" (if <6s)
  ✅ "Correct! Try to get faster." (if >6s)
  ❌ "The answer is 15" + "(Will appear again this round)"
```

### **Key Features:**
- **15 problems total**
- **Mix composition** shown at top (e.g., "Mixed: 7 emerging, 3 proficient, 2 mastered")
- **Immediate feedback** after each answer
- **Incorrect problems** go back into the stack (retry later in round)
- **Timer** shows seconds remaining (text only)
- **Accuracy tracker** shows running percentage

### **No Visual Timer Bar** ❌
Currently just shows: "15s", "14s", "13s"... as text

---

## ✅ ROUND 3: Quick Check

**Purpose**: Quick assessment (no feedback until end)

### **Current Implementation:**
```
Question: 7 + 8 = ?
[Input field]
Timer: 10s
[Submit button]

Note: "No feedback during assessment - keep going!"
```

### **Key Features:**
- **10 problems total**
- **10 seconds per problem**
- **NO FEEDBACK** during the round (keeps momentum)
- Feedback shown at end of session
- Timer counts down (text only)

---

## 🎯 Session Complete Screen

Shows:
- Facts learned in Round 1
- Total facts practiced
- Round 2 accuracy percentage
- **Promotions earned** (facts that moved up a level)
- Session quality (Excellent, Good, Fair, Incomplete)
- Total time spent
- Tomorrow's goal

---

## ⏱️ Current Timer Implementation

### **What EXISTS:**
- ✅ Countdown timers (numbers: 15s, 14s, 13s...)
- ✅ Different times per round:
  - Round 1 Recall: 15s
  - Round 2 Practice: 15s
  - Round 3 Assessment: 10s
- ✅ Timers update every second via intervals

### **What's MISSING:**
- ❌ **Visual timer bar** (no green → yellow → red progression)
- ❌ **Color-coded urgency** (no visual cue for time running out)
- ❌ **Progress bar** showing time elapsed

### **Current Timer Display:**
```html
<p class="recall-timer">15s remaining</p>
<p class="practice-timer">15s</p>
<p class="assessment-timer">10s</p>
```

Just plain text, no visual bar

---

## 🎮 Number Warm-Up

### **Current Implementation:**
- ❌ **DOES NOT EXIST**
- Practice starts directly with Round 1 (learning facts)
- No typing warm-up

### **What You Want:**
```
Before Round 1:
  "Warm-Up: Type these numbers!"
  
  Show: 5
  Student types: 5 [Enter]
  
  Show: 12
  Student types: 12 [Enter]
  
  Show: 15
  Student types: 15 [Enter]
  
  → "Great! You're warmed up. Let's practice facts!"
```

**Purpose:**
- Get fingers ready for typing
- Reduce first-problem errors from typing mistakes
- Build confidence
- Ensure numpad/keyboard is working

---

## 📊 Feedback System

### **Round 1 (Learning):**
- ✅ Shows correct answer when wrong
- ✅ Loops back to show complete fact again
- ✅ Requires 2 consecutive correct recalls
- ✅ Clear, supportive feedback

### **Round 2 (Practice):**
- ✅ Shows correct answer when wrong
- ✅ Incorrect problems recycled (appear again)
- ✅ Brief inline feedback (1-2s)
- ❌ **No persistent display** of what they got wrong
- ❌ **No strategy hints**

### **Round 3 (Assessment):**
- ❌ **NO FEEDBACK** during round (by design)
- ✅ Summary at end of session
- ❌ **Doesn't show which ones were missed**

---

## 🎨 Visual Design (Current)

### **Timer Display:**
```css
.recall-timer,
.practice-timer,
.assessment-timer {
  font-size: 1rem;
  color: #666;
  margin-top: 0.5rem;
}
```
- Just plain gray text
- No color changes
- No visual urgency

### **What's Needed:**
```css
/* Visual timer bar that changes color */
.timer-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  transition: width 1s linear, background 0.3s;
}

.timer-fill.plenty-time {
  background: linear-gradient(90deg, #10b981, #34d399);  /* Green */
}

.timer-fill.some-time {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);  /* Yellow */
}

.timer-fill.running-out {
  background: linear-gradient(90deg, #ef4444, #dc2626);  /* Red */
  animation: pulse 0.5s infinite;
}
```

---

## 🧮 Current Problem Generation

### **How Problems Are Selected:**

#### **If Student Has Problem Banks** (after diagnostic):
```
Round 1: Sample 3 from "doesNotKnow"
Round 2: 
  - 60% from current sub-level (doesNotKnow, emerging, approaching)
  - 20% maintenance from previous sub-levels
  - 20% reinforcement
Round 3: Mix of emerging/proficient/mastered
```

#### **If Student Has EMPTY Banks** (adaptive - NEW):
```
1. Generate ALL problems for current sub-level
2. Mark all as "doesNotKnow"
3. Use those for practice
4. Update banks after each session based on performance
```

---

## 🚀 Recommended Changes

### **1. Add Visual Timer Bar**
Replace text countdown with visual bar:
- **Green** (100% → 60%): Plenty of time
- **Yellow** (60% → 30%): Some time left
- **Red** (<30%): Running out!
- Pulse/flash when under 5 seconds

### **2. Add Number Warm-Up**
Before Round 1:
- Show 3-5 random numbers (5, 12, 15, 8, 20)
- Student types each one
- Builds typing confidence
- Takes ~10-15 seconds

### **3. Enhanced Feedback**
When student gets it wrong:
- ✅ Show correct answer (already does this)
- ➕ Show the fact visually (e.g., with dots/arrays for smaller numbers)
- ➕ Add strategy hint ("Try making 10 first!")
- ➕ Show related facts ("You know 7+7=14, so 7+8 is one more!")

### **4. Persistent Answer Display**
In Round 2, show a small log:
```
Recent:
  ✅ 7 + 8 = 15
  ❌ 6 + 7 = 13 (correct: 13) ← Wait, that's right?
  ✅ 9 + 5 = 14
```

---

## 🔍 Current Issues Found

### **Issue 1: No Warmup**
Students jump straight into facts - might make typing errors

### **Issue 2: No Visual Time Pressure**
Text countdown doesn't create urgency or help with time awareness

### **Issue 3: First Session with Empty Banks**
Student added to program now sees "0 problems" - **FIXED** with adaptive generation!

### **Issue 4: Permission Errors**
Students can't read their own fluency progress - need to check Firestore rules

---

## ✅ What's Working Well

1. ✅ **3-Round Structure**: Learning → Practice → Assessment
2. ✅ **Encoding Protocol**: See it → Pause → Recall (research-based)
3. ✅ **Incorrect Problem Recycling**: Round 2 gives second chances
4. ✅ **Adaptive Problem Selection**: Uses sub-levels now
5. ✅ **Immediate Feedback**: Students know if they're right
6. ✅ **Progress Tracking**: Promotions, streak, session quality
7. ✅ **Mix Composition**: Shows what proficiency levels being practiced

---

## 📋 Summary of Practice Flow

```
Start Screen
  → Shows proficiency distribution
  → Shows unlock progress
  → Shows today's plan (3 rounds)
  → Click "Start Practice"

Round 1: Learning (3-5 facts)
  → Encoding (see answer, 5s)
  → Consolidation (pause, 2s)
  → Recall (type answer, 15s)
  → Feedback (correct/incorrect)
  → Repeat until 2x correct

Round 2: Practice (15 facts)
  → Mixed proficiency levels
  → 15s per problem
  → Immediate feedback
  → Wrong answers recycled

Round 3: Quick Check (10 facts)
  → No feedback during
  → 10s per problem
  → Faster pace

Complete Screen
  → Summary of achievements
  → Promotions earned
  → Session quality
  → Tomorrow's goal
```

---

## 🎯 Proposed Enhancements (Next)

1. **Add Number Warmup** (before Round 1)
2. **Add Visual Timer Bar** (green → yellow → red)
3. **Improve feedback** with strategy hints
4. **Skip-ahead detection** (if 90%+ on first 10 problems)
5. **Better error messages** when banks are empty

---

**Current State**: Practice works but needs visual enhancements and warmup
**Next Steps**: Implement visual timer bar and number warmup


