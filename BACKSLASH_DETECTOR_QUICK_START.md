# Quick Start: Finding and Fixing Backslash Issues

## Problem
Students typed `3\4` instead of `3/4` and were marked wrong. You want to find these and fix them manually.

## Solution: 2-Step Process

### Step 1: Find the Issues (Use Detection Tool)

1. **Navigate to the tool:**
   - Go to: `http://your-site.com/admin/backslash-detector`
   - Or manually type `/admin/backslash-detector` in URL bar

2. **Click the big blue button:**
   - "🔍 Scan All Assessment Results"
   - Wait for scan to finish (shows progress)

3. **Review the results:**
   - You'll see a table with all affected answers
   - Check **"Show only incorrectly marked answers"** to focus on what needs fixing
   - Note the summary stats at top (how many assessments/students affected)

4. **Optional - Export for your records:**
   - Click **"📥 Export to CSV"** to save a spreadsheet
   - Or **"📋 Copy Assessment IDs"** to get a list

### Step 2: Fix Them Manually (One by One)

For each row in the table:

1. **Click "👁️ View"** button
   - Opens that specific result in a new page

2. **Click "✏️ Edit"** next to the points for that question
   - Input field appears

3. **Change points:**
   - If answer should be correct: enter full points (e.g., `1` or `2`)
   - If partial credit: enter appropriate value

4. **Click "✅ Save"**
   - System updates:
     - Points earned
     - Total score
     - Percentage
     - Marks as "manually adjusted"

5. **Repeat for next result**

## Example Walkthrough

**What you see in detector:**
```
Assessment: Fraction Basics Quiz
Student: Smith, John
Question: What is 3 divided by 4?
Student Answer: 3\4  (highlighted in yellow)
Corrected Answer: 3/4  (shown in green)
Status: ❌ Incorrect
```

**What you do:**
1. Click "👁️ View" → Opens result page
2. Find that question in the list
3. See: `0 / 1 pts` with "✏️ Edit" button
4. Click "✏️ Edit"
5. Change `0` to `1`
6. Click "✅ Save"
7. Score updates: `1 / 1 pts` ✅

**Result:**
- Student's score increases
- System marks it as "Adjusted by teacher"
- Student sees updated score next login

## Important Notes

✅ **Future answers are auto-fixed** - New submissions automatically convert `\` to `/` as students type

✅ **Manual control** - You review each case before fixing (prevents accidental mass changes)

✅ **Audit trail** - System records who adjusted and when

⚠️ **Only historical data** - This tool only finds OLD results, not new ones

## Pro Tips

### Tip 1: Filter First
Always check **"Show only incorrectly marked answers"** to focus on what needs fixing. Correctly marked answers with backslashes don't need attention.

### Tip 2: Batch by Assessment
If multiple students got same assessment wrong, you might want to:
1. Click "📋 Copy Assessment IDs"
2. Note which assessments have the most issues
3. Fix all results for one assessment at a time

### Tip 3: Export for Records
Before making changes:
1. Click "📥 Export to CSV"
2. Save the file as documentation
3. Helps track what you've fixed

### Tip 4: Check Twice
After fixing, you can re-run the scan to verify:
- Incorrectly marked count should decrease
- Fixed results won't show as incorrect anymore

## How Long Does It Take?

- **Scan:** 5-30 seconds (depends on how many results total)
- **Per fix:** 10-15 seconds per result
- **If you have 50 incorrect results:** ~10-15 minutes total

## What If Nothing Shows Up?

Great! That means:
✅ No students used backslashes in their answers, OR
✅ All backslash answers were marked correctly anyway

## Need Help?

**Tool not appearing?**
- Make sure you're logged in as admin
- Check URL is exactly `/admin/backslash-detector`

**Can't edit points?**
- Ensure you're logged in as teacher or admin
- Students can't edit their own results

**Export not working?**
- Check browser's download settings
- Try "Copy Assessment IDs" instead for simple list

## Quick Reference: URLs

- **Detection Tool:** `/admin/backslash-detector`
- **View Result:** `/assessment-result/{resultId}` (auto-opens from detector)
- **Assessment Results Overview:** `/assessment/{assessmentId}/results`
