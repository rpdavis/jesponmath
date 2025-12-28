# Quick Reference: Template System

## 🎯 What Changed?

**Saved templates now ACTUALLY work!**
- ✅ Templates are automatically used when you generate assessments
- ✅ Falls back to coded templates if no match
- ✅ Modal stays open after saving (no redirect)
- ✅ Clean UI (template section collapsed by default)

---

## 📝 How to Save a Template

1. Generate assessment for a goal → See preview question
2. Click "▶ Template Information (Optional)" to expand
3. **Fill in REQUIRED fields**:
   - Template Name
   - **Example Question Text*** ⭐ MOST IMPORTANT
   - **Example Correct Answer*** ⭐ MOST IMPORTANT
   - Goal Title Template
   - Goal Text Template
   - Subject, Area of Need, Assessment Method
4. Click "💾 Save as Template"
5. Success! Modal stays open

---

## 🔄 How Templates Are Used

**Automatic!** When you generate assessments:

```
1. System searches saved templates
2. Scores each template (area, topic, grade, etc.)
3. Uses best match if score ≥ 15
4. Falls back to coded template if no match
```

**You'll see in console**:
- ✨ "Found matching template: [name]" = Using your template
- 📋 "No matching template found" = Using coded template

---

## 🎯 Matching Criteria

Your template will be used if it matches:
- Area of Need ✓
- Topic keywords ✓
- Subject (math/ela) ✓
- Grade level (exact or ±1) ✓
- Assessment method (app/paper/hybrid) ✓

**Tip**: Use clear topic keywords like "elapsed time", "two-step equations", "fractions" in your template topic field!

---

## 💡 Examples

### Example 1: Elapsed Time
**Template**:
- Topic: `elapsed time`
- Example: "Sarah started reading at 2:15 PM..."

**Goal**: "Student will solve elapsed time word problems"

**Result**: ✅ Match! (topic keyword matches)

### Example 2: Fractions
**Template**:
- Topic: `fractions`
- Area: "Math Computation"

**Goal**: "Student will add fractions with unlike denominators"

**Result**: ✅ Match! (topic + area match)

### Example 3: No Match
**Template**: Only math templates saved

**Goal**: "Reading comprehension - main idea"

**Result**: ❌ No match → Uses coded template (still works!)

---

## 🐛 Troubleshooting

**"My template isn't being used!"**
1. Check template has **example question/answer** filled in
2. Check **topic** field matches goal keywords
3. Check **area of need** is similar
4. Look in browser console for match messages

**"I see duplicate question fields!"**
- Template section should be **collapsed by default**
- Only expand if you want to save as template
- If auto-expanded, refresh page

**"It redirects me after saving!"**
- This was fixed! Should stay on page now
- If still happens, clear browser cache

---

## 📊 Where to Find Saved Templates

- View/manage: `/admin/templates`
- Database: `goalTemplates` collection in Firestore
- Usage count tracks how often each is used

---

## 🎓 Pro Tips

1. **Start with good examples**: Best templates have clear, well-written example questions
2. **Use specific topics**: "elapsed time" better than just "time"
3. **Save variations**: Create multiple templates for different difficulty levels
4. **Check usage count**: See which templates are most useful
5. **Don't overthink it**: System falls back to coded templates if yours don't match

---

**Questions?** Check the full documentation:
- `PROGRESS_ASSESSMENT_FILE_MAP.md` - Complete file structure
- `TEMPLATE_SAVE_FIX.md` - UI bug fixes
- `HYBRID_TEMPLATE_SYSTEM.md` - How hybrid system works
- `SESSION_SUMMARY_TEMPLATE_SYSTEM.md` - Complete session recap




