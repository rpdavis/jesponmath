# LaTeX Math Notation Guide - Long Division & Custom Macros

## Overview
The JepsonMath platform now supports custom LaTeX macros that make it easier to create complex math notation, especially for long division problems.

## Long Division Notation

### Method 1: `\longdiv` (Recommended)

**Usage:** `\longdiv{divisor}{dividend}`

**Examples:**

1. Basic long division:
   ```
   $\longdiv{45}{345}$
   ```
   Displays: 45)‾345

2. In a question:
   ```
   Solve: $\longdiv{12}{144}$
   ```

3. With display mode (centered, larger):
   ```
   $$\longdiv{23}{552}$$
   ```

### Method 2: `\ldiv` (Simpler)

**Usage:** `\ldiv{divisor}{dividend}`

**Examples:**
```
$\ldiv{8}{96}$
```

### Method 3: Long Division with Steps

For showing the full long division work, use an array:

```latex
$$\begin{array}{r}
  \phantom{0}7 \\
45\overline{)345} \\
  -315 \\ \hline
  \phantom{0}30
\end{array}$$
```

This shows:
```
       7
45)‾345
  -315
   ---
    30
```

### Method 4: Complete Long Division Problem

```latex
$$\begin{array}{r|l}
& \phantom{00}7.67 \\
45 & 345.00 \\
& -315\phantom{.00} \\ \cline{2-2}
& \phantom{0}30.0 \\
& -27.0 \\ \cline{2-2}
& \phantom{00}3.00 \\
& \phantom{00}-2.70 \\ \cline{2-2}
& \phantom{000}0.30
\end{array}$$
```

## Vertical Addition/Subtraction

### Using `\stack`

**Usage:** `\stack{line1 \\ line2 \\ line3}`

**Example:**
```latex
$$\stack{
  \phantom{0}345 \\
+ \phantom{0}123 \\ \hline
  \phantom{0}468
}$$
```

Or without the macro:
```latex
$$\begin{array}{r}
  345 \\
+ 123 \\ \hline
  468
\end{array}$$
```

## Other Common Division Notations

### 1. Fraction Bar (Standard)
```
$\frac{345}{45}$
```

### 2. Division Symbol
```
$345 \div 45$
```

### 3. Division Slash
```
$345 / 45$
```

## Tips for Teachers

### Alignment Tips
- Use `\phantom{0}` to create invisible spacing for alignment
- Use `\,` for thin space, `\:` for medium space, `\;` for thick space
- Use `\hline` for horizontal lines in arrays

### Common Patterns

**Right-align numbers:**
```latex
\begin{array}{r}
  number1 \\
  number2
\end{array}
```

**Center-align:**
```latex
\begin{array}{c}
  centered1 \\
  centered2
\end{array}
```

**Left-align:**
```latex
\begin{array}{l}
  left1 \\
  left2
\end{array}
```

## Multi-Step Problems

### Example: Division with Remainder
```latex
$$\begin{array}{r}
  \phantom{0}15\text{ R}30 \\
45\overline{)705} \\
  -45\phantom{0} \\ \cline{1-1}
  \phantom{0}255 \\
  -225 \\ \cline{1-1}
  \phantom{00}30
\end{array}$$
```

### Example: Multi-Digit Multiplication
```latex
$$\begin{array}{r}
  \phantom{0}345 \\
\times \phantom{0}12 \\ \hline
  \phantom{0}690 \\
+ 3450 \\ \hline
  4140
\end{array}$$
```

## Quick Reference Card

| Operation | Code | Display |
|-----------|------|---------|
| Long division | `\longdiv{45}{345}` | 45)‾345 |
| Simple long div | `\ldiv{12}{144}` | 12)‾144 |
| Fraction | `\frac{3}{4}` | ¾ |
| Division symbol | `\div` | ÷ |
| Vertical stack | `\stack{3\\4}` | Right-aligned |

## Testing Your LaTeX

### In the Question Editor
1. Type your LaTeX code with `$...$` for inline or `$$...$$` for display
2. The preview will show the rendered math
3. If there's an error, the raw LaTeX will be shown

### Common Errors

**Error:** "Undefined control sequence"
- **Cause:** Typo in command name
- **Fix:** Check spelling (e.g., `\longdiv` not `\longdivision`)

**Error:** "Missing argument"
- **Cause:** Forgot curly braces
- **Fix:** Use `\longdiv{45}{345}` not `\longdiv 45 345`

**Error:** Misaligned numbers
- **Cause:** Missing `\phantom` spacing
- **Fix:** Add `\phantom{0}` to create invisible placeholder digits

## Examples for Common Grade Levels

### 3rd Grade: Basic Division
```
$\ldiv{3}{15}$
```

### 4th Grade: Division with Remainders
```
$$\begin{array}{r}
  12\text{ R}2 \\
5\overline{)62} \\
  -5\phantom{0} \\ \hline
  \phantom{0}12 \\
  -10 \\ \hline
  \phantom{00}2
\end{array}$$
```

### 5th Grade: Decimal Division
```
$$\begin{array}{r}
  \phantom{0}2.5 \\
4\overline{)10.0} \\
  -8\phantom{.0} \\ \hline
  \phantom{0}2.0 \\
  -2.0 \\ \hline
  \phantom{0}0.0
\end{array}$$
```

### 6th Grade: Multi-Digit Division
```
$$\longdiv{123}{15129}$$
```

## Advanced: Custom Styling

### Colored Division
```latex
$\color{blue}{\longdiv{45}{345}}$
```

### Larger Size
```latex
$\Large \longdiv{12}{144}$
```

### Bold
```latex
$\mathbf{\longdiv{8}{96}}$
```

## Need Help?

If you encounter issues with LaTeX rendering:
1. Check that your dollar signs are matched: `$...$` or `$$...$$`
2. Verify command spelling (case-sensitive!)
3. Ensure all curly braces `{}` are paired
4. Use the preview to test before saving

## Additional Resources

- Full KaTeX documentation: https://katex.org/docs/supported.html
- More array examples: https://katex.org/docs/support_table.html#environments
- Math symbols reference: https://katex.org/docs/support_table.html#symbols

---

**Last Updated:** January 2026
**Version:** 1.0 with custom macros
