# Quick Guide: Accept Any Variable

## For Teachers

### When to Use This Feature

Use the "Accept any variable letter" checkbox when:
- ✅ Students are writing linear equations
- ✅ Variable name doesn't matter (`x`, `y`, `n` all work)
- ✅ You want to avoid "wrong" answers due to variable choice

Don't use when:
- ❌ Specific variable is required (e.g., "solve for x" means they must use x)
- ❌ Multiple different variables in one equation
- ❌ Variable names have specific meaning (e.g., `t` for time)

---

## Creating a Question

### Step 1: Create Short-Answer Question

**Question Text:** "Write an equation where 4 times a number plus 5 equals 6"

**Correct Answer:** `4x+5=6` (or use any variable you prefer)

### Step 2: Enable the Checkbox

Find this section in the question editor:

```
☑ 📐 Accept any variable letter (e.g., 4x+5=6 same as 4c+5=6)

When enabled, students can use any letter for variables in 
equations (x, y, a, b, c, n, etc.)
```

**Click the checkbox** ✅

### Step 3: Save

That's it! Now students can use **any single letter** as the variable.

---

## What Students See

### Without Feature (Default Behavior)

**Correct Answer:** `4x+5=6`

| Student Writes | Result |
|----------------|--------|
| `4x+5=6` | ✅ Correct |
| `4c+5=6` | ❌ Incorrect |
| `4y+5=6` | ❌ Incorrect |

### With Feature Enabled

**Correct Answer:** `4x+5=6`  
**Feature:** ☑ Accept any variable letter

| Student Writes | Result |
|----------------|--------|
| `4x+5=6` | ✅ Correct |
| `4c+5=6` | ✅ Correct |
| `4y+5=6` | ✅ Correct |
| `4a+5=6` | ✅ Correct |
| `4n+5=6` | ✅ Correct |

---

## Common Scenarios

### Scenario 1: Simple Equation

**Question:** "Solve: A number plus 5 equals 12. Write the equation."

**Your Answer:** `x+5=12`  
**Enable:** ☑ Accept any variable

**Students can write:**
- `x+5=12` ✅
- `n+5=12` ✅
- `y+5=12` ✅

---

### Scenario 2: Two-Step Equation

**Question:** "Write the equation: 3 times a number minus 7 equals 8"

**Your Answer:** `3x-7=8`  
**Enable:** ☑ Accept any variable

**Students can write:**
- `3x-7=8` ✅
- `3n-7=8` ✅
- `3c-7=8` ✅

---

### Scenario 3: Variable on Both Sides

**Question:** "Write: 4 times a number plus 5 equals 2 times the number plus 13"

**Your Answer:** `4x+5=2x+13`  
**Enable:** ☑ Accept any variable

**Students can write:**
- `4x+5=2x+13` ✅
- `4y+5=2y+13` ✅
- `4n+5=2n+13` ✅

**Note:** Student must use the **same variable** throughout their answer.

---

## Combining Features

### With Equivalent Fractions

Enable both checkboxes:
- ☑ Accept equivalent fractions
- ☑ Accept any variable letter

**Example:**

**Your Answer:** `x/2=1/4`

**Students can write:**
- `x/2=1/4` ✅
- `y/2=1/4` ✅ (different variable)
- `x/2=2/8` ✅ (equivalent fraction)
- `y/2=2/8` ✅ (both!)

---

### With Acceptable Answers

Both features work together:

**Correct Answer:** `x=5`  
**Acceptable Answers:** `5=x` (reversed)  
**Enable:** ☑ Accept any variable

**Students can write:**
- `x=5` ✅
- `y=5` ✅
- `n=5` ✅
- `5=x` ✅
- `5=y` ✅
- `5=n` ✅

---

## Tips & Best Practices

### ✅ DO Use When:

1. **Open-ended variable choice**
   - "Write an equation..."
   - "Express as..."
   - "Form an equation..."

2. **Word problems**
   - "Let n be the number..."
   - Students might choose different letters

3. **Practice problems**
   - Focus is on structure, not variable name

### ❌ DON'T Use When:

1. **Specific variable required**
   - "Solve for x" → They must use `x`
   - "Find t when..." → They must use `t`

2. **Multiple variables**
   - "Write an equation with x and y"
   - Feature doesn't handle mixed variables well

3. **Variable has meaning**
   - `d = distance`, `t = time`, `r = rate`
   - Variable name matters for context

---

## Troubleshooting

### Problem: Students Using Different Variables Get Marked Wrong

**Solution:** Make sure the checkbox is enabled:
1. Edit the question
2. Scroll to "Accept any variable letter"
3. Check the box ☑
4. Save

---

### Problem: Student Used Two Different Variables

**Example:** Student wrote `4x+5=2y+13`

**Why it fails:** Feature only normalizes consistently used variables

**Solution:** Either:
- Accept it manually if structure is correct
- Or clarify in question: "Use the same variable throughout"

---

### Problem: Feature Changing Words

**Example:** Input `cost+5=10` becomes `xost+5=10`

**This shouldn't happen!** Our regex avoids multi-letter words.

**If it does:** Report as bug - normalization shouldn't affect words like `cost`, `sin`, `cos`, etc.

---

## Examples by Grade Level

### Elementary (Grade 4-5)

**Question:** "Write: some number plus 3 equals 7"

**Your Answer:** `n+3=7`  
**Enable:** ☑ Accept any variable

**Why:** Young students might use different letters they've learned

---

### Middle School (Grade 6-8)

**Question:** "Write the equation: 2 times a number minus 5 equals 11"

**Your Answer:** `2x-5=11`  
**Enable:** ☑ Accept any variable

**Why:** Focus on equation structure, not variable convention

---

### Algebra I (Grade 8-9)

**Question:** "Write an equation for: 4 less than 3 times a number is 17"

**Your Answer:** `3x-4=17`  
**Enable:** ☑ Accept any variable

**Why:** Variable choice is personal preference at this level

---

## FAQ

**Q: Can I use this with multiple choice questions?**  
A: No, this feature is only for short-answer questions.

**Q: Does it work with Greek letters (θ, α)?**  
A: Not yet. Currently only English letters a-z.

**Q: What about uppercase variables?**  
A: System converts to lowercase first, so `X` and `x` are treated the same.

**Q: Can students use subscripts (x₁, x₂)?**  
A: Subscripted variables are preserved but not normalized.

**Q: Does it work with fractions in the equation?**  
A: Yes! `x/2+5=6` same as `y/2+5=6`

**Q: What about absolute values?**  
A: Yes! `|x|=5` same as `|y|=5`

---

## Summary

**One checkbox = Accept any variable letter**

- ✅ Simple to enable
- ✅ Works for most equations
- ✅ Student-friendly
- ✅ Focus on math, not notation

**Perfect for:** Linear equations, expressions, word problems where variable choice is arbitrary.
