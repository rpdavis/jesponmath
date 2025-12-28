# How to Reset Fluency Progress for Testing

## 🔄 Quick Reset Tool

**Route**: `/fluency/reset-progress`

---

## ✅ How to Access

### Option 1: From Fluency Dashboard
```
1. Go to fluency dashboard
2. Look at top for debug links:
   📊 CPM Report | 🧪 Simulator | 🔬 Debug Mode | 🔄 Reset Progress
3. Click "🔄 Reset Progress" (red link)
```

### Option 2: Direct URL
```
Navigate to: /fluency/reset-progress
```

Or type in browser:
```
http://localhost:5173/fluency/reset-progress
```

---

## 🎯 How to Reset Your Own Progress (For Testing)

**Step 1**: Navigate to `/fluency/reset-progress`

**Step 2**: Select yourself from the dropdown
```
Should show your current progress:
- Addition: Level X, Y% proficiency, Z practice days
- Subtraction: ...
```

**Step 3**: Click "🔄 Reset & Re-Add to Program" button
```
This will:
1. Delete all your fluency data
2. Immediately add you back at Addition Level 1
3. You can start fresh
```

**Step 4**: Confirm twice
```
First confirmation: General warning
Second confirmation: Final confirmation
```

**Step 5**: Done!
```
You'll see: "✅ Reset Complete!"
Navigate to /fluency/daily-practice
You're now at Addition Level 1, 0% proficiency
```

---

## 🧪 Testing Scenarios

### Scenario 1: Test From Absolute Beginning
```
1. Reset & Re-Add yourself
2. Go to /fluency/daily-practice
3. See Addition Level 1, 0%
4. Complete first session
5. Watch proficiency grow from 0% → 40%+
6. Test all module features from scratch
```

### Scenario 2: Test Placement/Acceleration
```
1. Reset & Re-Add yourself
2. Take placement diagnostic
3. Intentionally score 95%+ on addition and subtraction
4. See if you skip to multiplication
5. Test acceleration features
6. Reset and try again with different scores
```

### Scenario 3: Test Debug Logging
```
1. Enable debug mode for yourself
2. Reset & Re-Add your progress
3. Complete a practice session
4. Check /fluency/debug-manager
5. Should see detailed session log
6. Test logging from session 1
```

---

## ⚠️ Important Notes

### What Gets Deleted:
- ✅ ALL fluency progress (all operations)
- ✅ ALL practice sessions
- ✅ ALL paper assessments
- ✅ Problem proficiency data
- ✅ Sub-level completion

### What Stays:
- ✅ Your student/teacher account
- ✅ Other assessments (ESA, PA, SA)
- ✅ Goals
- ✅ Class assignments

### Cannot Be Undone:
- ⚠️ This permanently deletes data
- ⚠️ Use only for testing
- ⚠️ Don't use on real student data unless intentional

---

## 🐛 Troubleshooting

### Link Doesn't Work?
**Check**:
1. Are you logged in as a teacher?
2. Is the dev server running? (`npm run dev`)
3. Check browser console (F12) for errors
4. Try direct URL: `http://localhost:5173/fluency/reset-progress`

### Route Not Found?
**Fix**:
```
1. Stop dev server (Ctrl+C)
2. Run: npm run build
3. Run: npm run dev
4. Try again
```

### Selection Not Loading Progress?
**Check**:
1. Does the student have fluency data?
2. Check browser console for errors
3. Try refreshing the page
4. Try a different student

---

## 🎯 Quick Reference

**To reset yourself for testing**:
```
1. /fluency/reset-progress
2. Select your name
3. Click "Reset & Re-Add to Program"
4. Confirm (2x)
5. Done! Go to /fluency/daily-practice
```

**To reset a student**:
```
Same as above, but select student instead
Use "Reset Only" if you don't want to re-add them
```

**To add a new student** (no existing progress):
```
1. /fluency/reset-progress
2. Select student
3. Should show "No fluency progress yet"
4. Click "Add to Fluency Program"
```

---

*Created: 2025-01-XX*
*Route: /fluency/reset-progress*
*Status: ✅ Available*











