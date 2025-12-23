# Dollar Sign Support in Questions - FIXED

## ✅ The Fix is Now Live!

I've updated the LaTeX renderer to properly handle escaped dollar signs. Now `\$` works correctly!

---

## How to Show Dollar Signs

### Method 1: Use `\$` (Backslash Dollar) ✅ **NOW WORKS!**

**Type this in your questions:**
```
Sarah has \$5.00 and John has \$3.50. How much money do they have together?
```

**Students will see:**
```
Sarah has $5.00 and John has $3.50. How much money do they have together?
```

---

## Quick Examples

| What You Type | What Students See |
|---------------|-------------------|
| `\$5.00` | $5.00 |
| `\$10 + \$5 = \$15` | $10 + $5 = $15 |
| `Cost is \$20.50` | Cost is $20.50 |
| `I have \$100 in my wallet` | I have $100 in my wallet |

---

## Mixing Money with Math

You can use both dollar signs AND math notation:

```
Sarah has \$20. If she buys $x$ items at \$4 each, she will have $\$20 - \$4x$ left.
```

**Students see:**
```
Sarah has $20. If she buys x items at $4 each, she will have $20 - $4x left.
```

---

## Common Money Problem Templates

### Simple Addition
```
John has \$15.50 and earns \$8.25 more. How much does he have now?
```

### With Variables
```
If pencils cost \$0.50 each and you buy $n$ pencils, the total cost is $C = \$0.50n$
```

### Word Problem
```
A book costs \$12.99 and a pen costs \$2.49. If you buy 2 books and 3 pens, 
what is the total? Calculate: $2(\$12.99) + 3(\$2.49)$
```

### Price Comparison
```
Apples: \$2.50/lb, Oranges: \$3.00/lb, Bananas: \$1.25/lb
If you buy $a$ lbs of apples, $o$ lbs of oranges, and $b$ lbs of bananas:
Total = $\$2.50a + \$3.00o + \$1.25b$
```

---

## Technical Details - What Changed

### Before (Broken)
The LaTeX renderer would see `\$5.00` and not properly handle the escape sequence.

### After (Fixed)
The renderer now:
1. **Finds all `\$` patterns** and temporarily replaces them with a placeholder
2. **Processes math expressions** (`$x + 5$` becomes rendered math)
3. **Restores literal dollar signs** from the placeholders

**Files Updated:**
- `src/utils/latexUtils.ts` - Main rendering utility
- `src/components/LaTeXEditor.vue` - Editor preview rendering

---

## When to Use `\$`

**Always use `\$` when you want to show a dollar sign**

✅ Good examples:
- `\$5.00` → Shows $5.00
- `\$x` → Shows $x (the variable x with a dollar sign before it)
- `Total: \$25` → Shows Total: $25

❌ Don't use plain `$` for money:
- `$5.00` → Tries to render `5.00` as math (might work but unpredictable)
- `$5 + $3` → Tries to render `5 + ` as math (breaks)

---

## Using Prefix/Suffix for Money Questions

For short-answer questions about money, you can use:

### Option A: Dollar Sign Prefix
- **Answer Prefix:** `$`
- **Correct Answer:** `5.00`
- **Student sees:** `$ [____]` (input box after dollar sign)

### Option B: Text in Question
- **Question:** `How much? (Include \$ in your answer)`
- **Correct Answer:** `$5.00`
- **Student sees:** Regular text input

### Option C: "Dollars" Suffix
- **Answer Suffix:** `dollars`
- **Correct Answer:** `5.00`
- **Student sees:** `[____] dollars`

---

## Testing Your Questions

After creating a question with dollar signs:

1. **Click Preview** in the assessment editor
2. **Check the display** - you should see proper `$` symbols
3. **Test taking the assessment** as a student
4. **Verify the answer checking** works correctly

---

## Examples You Can Copy & Paste

```
1. Sarah has \$50 in savings and deposits \$20 more. How much does she have?

2. A ticket costs \$8.50. How many tickets can you buy with \$50?

3. The formula for total cost is $C = \$5 + \$2n$ where $n$ is the number of items.

4. Store A sells for \$15.99, Store B sells for \$12.49. What's the difference?

5. If $x$ represents dollars and Maria has $3x - \$5$, how much does she have when $x = 10$?

6. Pencils are \$0.75, notebooks are \$2.50, and erasers are \$1.00. 
   Buy 4 pencils, 2 notebooks, and 3 erasers. What's the total cost?

7. John earns \$15 per hour. If he works $h$ hours, he earns $\$15h$ total.

8. Compare prices: \$20, \$15.50, \$32.75. Which is cheapest?

9. You have \$100. After buying $n$ items at \$7 each, you have $\$100 - \$7n$ left.

10. Calculate the change: Paid \$20.00 for an item costing \$13.47
```

---

## Status

✅ **Fixed and Deployed** - December 23, 2025  
✅ **Live at:** https://jepsonmath.web.app  
✅ **Works in:** All question types (multiple choice, short answer, etc.)  

**To use it:**
1. Hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Type `\$` whenever you want to show a dollar sign
3. Preview your questions to verify they look correct

---

## Summary

**Before:** `\$` didn't work, showing dollar signs was problematic  
**After:** `\$` properly renders as `$` in all questions  
**How:** Type `\$5.00` to show $5.00  
**Status:** ✅ Live and working!

