# Fix Duplicate Problems in Daily Practice 🔧

**Issue**: Seeing the same problems repeatedly in daily practice

**Root Cause**: User started fluency program before deduplication code was added. Their Firestore progress has duplicate problems in the banks.

---

## 🚀 Quick Fix Options

### Option 1: Run Cleanup Script (RECOMMENDED)

**Automatically fixes everyone's data:**

```bash
cd /Users/rd/jepsonmath
node scripts/fixDuplicateFluencyProblems.cjs
```

**What it does:**
- Finds all students with fluency progress
- Deduplicates problems in each bank
- Updates Firestore
- Takes 1-2 minutes

**Output:**
```
🔍 Starting duplicate problem cleanup...
Found 15 progress documents

📊 Checking student123 - addition:
  doesNotKnow: 45 → 30 (removed 15 duplicates)
  emerging: 20 → 15 (removed 5 duplicates)
  ✅ Updated Firestore

...

🎉 Cleanup Complete!
📊 Results:
  - Progress documents checked: 15
  - Documents with duplicates: 8
  - Total duplicates removed: 156
  
✅ Students should now see unique problems in practice!
```

### Option 2: Manual Reset (For Single Student)

**If you just want to fix YOUR progress:**

1. Go to Firebase Console → Firestore
2. Navigate to `mathFluencyProgress` collection
3. Find your document (e.g., `studentUid_addition`)
4. Delete it
5. Restart the diagnostic

**Downside:** Loses all progress, starts over

### Option 3: Check Console for Warnings

**The code already tries to detect duplicates:**

Open browser console and look for:
```
⚠️ Found X duplicate problems in banks (removed)
⚠️ Duplicate problemIds found in problem banks!
❌ CRITICAL: Duplicate problemIds found in diagnostic sample!
```

If you see these, deduplication is working IN MEMORY but not fixing Firestore.

---

## 🔍 Why This Happened

### Timeline

**Before:** (When you started)
```
Daily Practice code didn't check for duplicates
  ↓
Problem could be in multiple banks:
  - doesNotKnow bank: [problem "8+7"]
  - emerging bank: [problem "8+7"]  ← Duplicate!
  ↓
When selecting practice problems:
  - Picked from doesNotKnow: "8+7"
  - Also picked from emerging: "8+7"
  ↓
Student sees "8+7" twice in same session!
```

**After:** (Code fixed, but your data still has duplicates)
```
New code has deduplication
  ↓
Loads your old progress from Firestore:
  - doesNotKnow: [8+7, 9+6, 8+7, 9+6]  ← Duplicates in storage!
  ↓
Deduplicates in memory:
  - [8+7, 9+6]  ← Only 2 unique
  ↓
But small pool = same problems appear often
  ↓
Firestore still has duplicates (not fixed in database)
```

---

## ✅ The Permanent Fix (Option 1)

### Run the Cleanup Script

```bash
cd /Users/rd/jepsonmath
node scripts/fixDuplicateFluencyProblems.cjs
```

**This will:**
1. Load each student's fluency progress
2. Remove duplicate problems from all banks
3. Update Firestore with clean data
4. Fix the issue permanently

**Safe:**
- Only removes duplicates (same problemId)
- Keeps one copy of each problem
- Preserves all attempt data
- Non-destructive

---

## 🧪 Test After Running Script

1. Run cleanup script
2. Reload practice page (hard refresh: Cmd+Shift+R)
3. Start a new practice session
4. Verify unique problems
5. Check console for:
   ```
   ✓ No duplicates found
   ```
   (Instead of warnings)

---

## 🔧 If Script Doesn't Work

### Alternative: Add Session Deduplication

Add this to the practice session code to deduplicate the final problem set:

```typescript
// After selecting round2Problems, before showing them:
const uniqueProblems = deduplicateByDisplayText(round2Problems);
console.log(`🔍 Session: ${round2Problems.length} → ${uniqueProblems.length} unique`);
round2Problems.value = uniqueProblems;
```

But **running the cleanup script is better** - fixes the root cause!

---

## 📝 Summary

**Problem:** Duplicate problems in Firestore from before deduplication was added
**Solution:** Run `fixDuplicateFluencyProblems.cjs` script
**Time:** 2 minutes to run
**Result:** No more repeated problems!

**Then your practice will work perfectly with your new mini-lesson system!** 🎉






















