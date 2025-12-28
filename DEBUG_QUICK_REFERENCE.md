# Debug System - Quick Reference Card

## 🚀 Quick Start (2 Minutes)

### Enable Debug Mode:
```
1. Navigate to: /fluency/debug-manager
2. Select student
3. Click "Enable Debug Mode"
4. Have student complete session
5. Review logs!
```

---

## 🔬 Console Commands

### View Analysis:
```javascript
import { printAnalysis } from '@/utils/detailedDebugLogger'
printAnalysis('studentUid')
```

### Export Data:
```javascript
import { exportDetailedLogsToCSV, downloadDetailedCSV } from '@/utils/detailedDebugLogger'
const csv = exportDetailedLogsToCSV('studentUid')
downloadDetailedCSV(csv, 'student-sessions.csv')
```

### Check Who's Debugging:
```javascript
import { getDebugEnabledStudents } from '@/utils/detailedDebugLogger'
getDebugEnabledStudents()
```

---

## 📊 What Gets Logged (Per Session)

### ✅ Key Metrics:
- Proficiency before → after (e.g., 68% → 89%)
- Diagnostic score (19/20)
- Round 2 score (15/15)
- Round 3 score (10/10)
- Problems promoted (11 problems)
- Fast-track mode (yes/no)
- Advancement (yes/no, threshold used)

### ✅ Problem-Level Details:
- Every problem attempted
- Student answer vs correct answer
- Response time
- Proficiency before → after
- Timestamp

---

## 🎯 What to Look For

### ✅ Good Signs:
- Proficiency increasing +20-40% per session
- Problems promoting: doesNotKnow → emerging → approaching
- Advancement at 85% (or 80%/75% for high performers)
- Fast-track activating at 90%+
- No errors in issues array

### ⚠️ Warning Signs:
- Proficiency stuck/decreasing
- No advancement at 85%+
- Fast-track not activating at 90%+
- Many problems demoting
- Errors in issues array

---

## 🧪 Test Simulator

### Navigate to:
```
/fluency/acceleration-simulator
```

### Test These:
- High Performer: 97%/96% → Should skip to multiplication
- Moderate: 87%/84% → Should skip level 1
- Standard: 75%/70% → Should start at level 1

---

## 📁 Export Formats

### sessions.csv:
```
Session, Date, Proficiency Start, Proficiency End, Change, Scores, Advanced, Fast-Track
1, 2025-01-15, 0%, 42%, +42%, 18/20|14/15|9/10, No, No
2, 2025-01-16, 42%, 68%, +26%, 19/20|15/15|10/10, No, No
3, 2025-01-17, 68%, 89%, +21%, 20/20|15/15|10/10, Yes, Yes
```

### problems.csv:
```
Session, Round, Problem, Student Answer, Correct, Response Time, Prof Before, Prof After
1, Diagnostic, 7+8=?, 15, Yes, 2340ms, doesNotKnow, N/A
1, Round 2, 7+8=?, 15, Yes, 1890ms, doesNotKnow, emerging
2, Round 2, 7+8=?, 15, Yes, 1420ms, emerging, approaching
```

---

## ⚡ Recommended Students to Debug

### For Validation Testing:
1. **Alex** - High performer (diagnostic 95%+)
   - Should skip to multiplication
   - Fast-track should activate early
   - Should use 80% threshold

2. **Maria** - Moderate (diagnostic 80-90%)
   - Should skip level 1
   - Fast-track activates when reaching 90%
   - Standard 85% threshold initially

3. **Jordan** - Struggling (diagnostic <70%)
   - Should start at level 1
   - Standard 85% threshold
   - Standard practice distribution

---

## 🎯 Next Actions

### Today:
- [ ] Test simulator (10 min)
- [ ] Enable debug for 3 students (5 min)

### This Week:
- [ ] Monitor debug students' sessions
- [ ] Review logs after each session
- [ ] Export CSV mid-week and end-of-week

### Next Week:
- [ ] Fix critical issues (cross-operation wiring)
- [ ] Initialize problem banks for skipped levels
- [ ] Re-test with debug students

### Week 3:
- [ ] Deploy to all students
- [ ] Keep debug enabled for monitoring
- [ ] Collect effectiveness data

---

## 💡 Pro Tips

1. **Keep console open**: See logs in real-time
2. **Export weekly**: Save CSVs every Friday
3. **Use presets**: Test simulator before enabling for students
4. **Monitor early**: Check first 3 sessions closely
5. **Share logs**: Export and discuss with team

---

## 🆘 Troubleshooting

### Debug not working?
```javascript
import { getDebugEnabledStudents } from '@/utils/detailedDebugLogger'
getDebugEnabledStudents() // Should include studentUid
```

### No logs in console?
- Open DevTools (F12) BEFORE session starts
- Set filter to "All levels"
- Check debug mode is enabled

### Export empty?
```javascript
import { getDetailedLogs } from '@/utils/detailedDebugLogger'
getDetailedLogs('studentUid').length // Should be > 0
```

---

*Print this and keep it handy while testing!*











