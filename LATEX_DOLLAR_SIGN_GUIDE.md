# How to Show Dollar Signs in Questions (KaTeX/LaTeX Guide)

## The Problem
The app uses `$` to denote math mode in LaTeX/KaTeX. When you type `$5.00`, the system thinks you're starting a math expression, which can cause rendering issues.

---

## Solutions

### ✅ Solution 1: Escape the Dollar Sign (RECOMMENDED)

**Use `\$` (backslash before the dollar sign)**

```
Examples:
- How much is \$5.00 + \$3.50?
- Sarah has \$10.00 in her wallet.
- The cost is \$x where $x = 5$.
```

**Result:**
- How much is $5.00 + $3.50?
- Sarah has $10.00 in her wallet.
- The cost is $x where x = 5.

---

### ✅ Solution 2: Avoid Single Dollar Signs

If you don't need any math notation, you can type dollar signs normally **as long as you don't create a `$...$` pattern:**

```
Good ✅:
- Sarah has $20 dollars
- The price is $5
- John spent $10 yesterday

Bad ❌:
- Sarah has $5 + $3  ← This creates $5 + $ which breaks
```

**Why this works:** The LaTeX renderer only activates when it finds matching pairs of `$` symbols.

---

### ✅ Solution 3: Mix Regular Text with Math Mode

Keep money amounts in regular text and put only math expressions in LaTeX:

```
Examples:
- Sarah has $15. If she buys $x$ items at $3 each, she'll have $15 - 3x$ left.
- The cost is $20. Solve: $c + \$5 = \$20$ (find $c$)
```

---

## Quick Reference Table

| Scenario | What To Type | What Students See |
|----------|-------------|-------------------|
| **Single amount** | `\$5.00` | $5.00 |
| **Addition** | `\$5 + \$3 = \$8` | $5 + $3 = $8 |
| **With variable** | `\$x = \$5` | $x = $5 |
| **Variable in math** | `Cost is \$20. Find $x$` | Cost is $20. Find x |
| **Equation** | `$\$5x = \$20$` | $5x = $20 |
| **Multiple $ signs** | `\$5, \$10, \$15` | $5, $10, $15 |

---

## Common Money Problem Templates

### Template 1: Simple Word Problem
```
Sarah has \$15.00 and buys a toy for \$7.50. 
How much money does she have left?
```

### Template 2: Word Problem with Variable
```
John has \$20. He buys $x$ books at \$4 each. 
Write an equation: $20 - 4x = $ money left
```

### Template 3: Algebraic Equation
```
If Sarah earns \$5 per hour and works $h$ hours, 
her total earnings are: $E = 5h$
```

### Template 4: Comparison
```
Book A costs \$12 and Book B costs \$8. 
How much more does Book A cost? 
Answer: $\$12 - \$8 = \$4$
```

### Template 5: Multiple Items
```
Pencils cost \$0.50, erasers cost \$1.00, and notebooks cost \$2.50.
If you buy 2 pencils, 1 eraser, and 3 notebooks, what's the total?
$2(0.50) + 1(1.00) + 3(2.50) = ?$
```

---

## Special Cases

### When to Use Math Mode for Money

Sometimes you want dollar amounts IN math expressions:

```
Wrong: $5x = $20  ← Creates $5x = $ which is broken
Right: $\$5x = \$20$  ← Properly formatted equation
```

**Inside math mode (`$...$`), you STILL need `\$` for dollar signs!**

---

## Prefix/Suffix for Money Answers

When creating short-answer questions with money:

### Option 1: Use Prefix
- **Answer Prefix:** `$`
- **Correct Answer:** `5.00`
- **Student sees:** `$ [____]`

### Option 2: Use Escaped Dollar in Question
- **Question:** `How much? (Answer with dollar sign like \$5.00)`
- **Correct Answer:** `$5.00`
- **Student sees:** Normal text input

### Option 3: Use Suffix  
- **Answer Suffix:** `dollars`
- **Correct Answer:** `5.00`
- **Student sees:** `[____] dollars`

---

## Testing Your Questions

After entering a question with dollar signs:

1. **Click the Preview button** in the assessment editor
2. **Check the display** - dollar signs should show properly
3. **If you see weird spacing or missing text**, you need more `\` escapes

---

## Common Mistakes and Fixes

| Mistake | What Happens | Fix |
|---------|--------------|-----|
| `$5 + $3` | Treats `5 + ` as math | `\$5 + \$3` |
| `$50 dollars` | Treats `50 dollars` as math | `\$50 dollars` |
| `$$50` | Treats as display math block | `\$\$50` or `\$ \$ 50` |
| Inside math: `$5x = $20$` | Broken | `$\$5x = \$20$` |

---

## Summary

**Golden Rule:** Whenever you want to show an actual dollar sign, use `\$` instead of just `$`

**Exception:** If your text has NO single `$` characters that would create pairs, you can skip the backslash.

**When in doubt:** Always use `\$` for money, and test with the Preview button!

---

## Examples You Can Copy

```
1. Sarah has \$50 in her bank account. She withdraws \$20. How much is left?

2. If $x$ represents the number of dollars John has, and he earns \$5 more, 
   he will have $x + 5$ dollars total. If $x = 10$, how much does he have?

3. The price formula is $P = \$10 + \$2n$ where $n$ is the number of items.

4. Costs: Apples \$2.00, Oranges \$1.50, Bananas \$1.00. 
   Buy 3 apples and 2 oranges. Calculate: $3(\$2.00) + 2(\$1.50)$

5. Simple: A candy bar costs \$1.25. How many can you buy with \$10.00?
```

---

**Need Help?** 
- Use the Preview button to test
- If it looks wrong, add more `\` before `$` symbols
- Remember: `\$` shows a dollar sign, `$x$` shows math

**Status:** Works in all question types (multiple choice, short answer, etc.)

