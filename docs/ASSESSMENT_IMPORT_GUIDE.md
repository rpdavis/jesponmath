# 📄 JSON Assessment Importer - Teacher Guide

## Overview
The JSON Assessment Importer allows teachers to quickly create assessments by uploading or pasting pre-formatted JSON code. This is perfect for:
- Creating assessments faster than using the UI
- Batch creating multiple assessments
- Reusing assessment templates across goals
- Importing assessments from external tools

## How to Use

### Step 1: Access the Importer
1. Go to **Goal Management** page
2. Click the **"📄 Import JSON Assessment"** button at the top

### Step 2: Prepare Your JSON
You can either:
- **Upload a `.json` file** by clicking "Choose JSON File" or dragging/dropping
- **Paste JSON code** directly into the text box

See `assessment-import-template.json` for a complete example.

### Step 3: Validate
1. Click **"✅ Validate & Preview"**
2. Fix any errors shown (required fields, invalid values, etc.)
3. Review warnings (optional fields)

### Step 4: Preview
1. Review the assessment details
2. Check each question renders correctly
3. Verify KaTeX math formatting

### Step 5: Create
Click **"✅ Create Assessment"** to save to Firestore

---

## JSON Format Reference

### Required Fields

```json
{
  "title": "Assessment Title",
  "description": "Brief description",
  "goalId": "firestore-goal-id",
  "category": "PA",  // HW, Assign, ESA, SA, PA, or Other
  "gradeLevel": 7,
  "questions": [/* array of questions */]
}
```

### Optional Assessment Fields

```json
{
  "academicPeriod": "q2",  // q1, q2, q3, q4, s1, s2, etc.
  "instructions": "Answer all questions carefully.",
  "accommodations": ["Extended time", "Read aloud"],
  "standard": "CCSS.MATH.7.NS.A.3",
  "timeLimit": 45,  // minutes, 0 = no limit
  
  // File upload settings
  "allowFileUpload": true,
  "requireFileUpload": true,
  "fileUploadInstructions": "Take clear photos of your work.",
  "maxFileSize": 10,  // MB
  "allowedFileTypes": ["jpg,jpeg,png", "pdf"],
  "photoOrientation": "landscape",  // or "portrait"
  
  // Multi-page settings
  "requireMultiplePages": false,
  "requiredPageCount": 2,
  "pageLabels": ["Page 1", "Page 2"],
  "allowExtraPages": true,
  
  // Retake settings
  "allowRetakes": true,
  "maxRetakes": 2,  // 0 = unlimited
  "retakeMode": "separate",  // or "combined"
  "retakeInstructions": "You may retake to improve your score."
}
```

---

## Question Types

### 1. Short Answer
```json
{
  "questionText": "What is $2 + 2$?",
  "questionType": "short-answer",
  "correctAnswer": "4",
  "answerPrefix": "",  // e.g., "x=" or "$"
  "answerSuffix": "",  // e.g., " hours" or " dollars"
  "acceptableAnswers": ["4", "4.0", "four"],
  "explanation": "2 plus 2 equals 4",
  "points": 10,
  "standard": "1.OA.C.6",
  "standards": ["1.OA.C.6"],
  "requiresPhoto": false
}
```

### 2. Multiple Choice
```json
{
  "questionText": "What is the capital of California?",
  "questionType": "multiple-choice",
  "options": ["Los Angeles", "San Francisco", "Sacramento", "San Diego"],
  "correctAnswer": "Sacramento",
  "points": 5
}
```

### 3. Fraction
```json
{
  "questionText": "Simplify: $\\frac{6}{8}$",
  "questionType": "fraction",
  "correctAnswer": "3/4",
  "acceptEquivalentFractions": true,
  "correctFractionAnswers": [
    {"numerator": 3, "denominator": 4},
    "3/4"
  ],
  "points": 10
}
```

### 4. Horizontal Ordering
```json
{
  "questionText": "Order from least to greatest:",
  "questionType": "horizontal-ordering",
  "orderingItems": ["5", "-3", "0", "2"],
  "correctHorizontalOrder": ["-3", "0", "2", "5"],
  "orderDirection": "ascending",
  "correctAnswer": "",
  "points": 10
}
```

### 5. Checkbox (Multiple Correct)
```json
{
  "questionText": "Which are prime numbers?",
  "questionType": "checkbox",
  "options": ["2", "4", "7", "9", "11"],
  "correctAnswers": ["2", "7", "11"],
  "correctAnswer": "",
  "points": 10
}
```

### 6. Matching
```json
{
  "questionText": "Match each term to its definition:",
  "questionType": "matching",
  "leftItems": ["Numerator", "Denominator"],
  "rightItems": ["Top number", "Bottom number"],
  "correctMatches": {
    "Numerator": "Top number",
    "Denominator": "Bottom number"
  },
  "points": 10
}
```

---

## KaTeX Math Formatting

**CRITICAL**: Use double backslashes (`\\\\`) in JSON for LaTeX commands!

### Examples:

| Math Expression | JSON String |
|----------------|-------------|
| $\frac{1}{2}$ | `"$\\\\frac{1}{2}$"` |
| $x^2$ | `"$x^2$"` |
| $\sqrt{25}$ | `"$\\\\sqrt{25}$"` |
| $\$18.25$ | `"$\\\\$18.25$"` (dollar amounts) |

### Why Double Backslashes?
JSON treats `\` as an escape character, so `\frac` becomes just `frac`. Use `\\frac` in JSON to get `\frac` in the rendered output.

---

## Tips & Best Practices

### 1. Start with the Template
Copy `assessment-import-template.json` and modify it for your needs.

### 2. Validate Often
Use an online JSON validator (like jsonlint.com) before importing.

### 3. Math Formatting
- Always wrap math in `$...$` (inline) or `$$...$$` (display)
- Use double backslashes for LaTeX commands
- Dollar amounts: `$\\$18.25$`

### 4. Question IDs
Leave `id` fields empty - they'll be auto-generated.

### 5. Standards
You can specify standards per question or for the whole assessment:
```json
"standard": "7.NS.A.3",
"standards": ["7.NS.A.3", "7.NS.A.2"]
```

### 6. Batch Creation
Create multiple JSON files, import one at a time.

---

## Common Errors

### ❌ "Title is required"
```json
// WRONG - missing title
{
  "description": "My assessment"
}

// CORRECT
{
  "title": "My Assessment Title",
  "description": "My assessment"
}
```

### ❌ "Invalid category"
```json
// WRONG
{ "category": "Quiz" }

// CORRECT - must be one of: HW, Assign, ESA, SA, PA, Other
{ "category": "PA" }
```

### ❌ Math not rendering
```json
// WRONG - single backslash
"questionText": "Calculate $\frac{1}{2}$"

// CORRECT - double backslash
"questionText": "Calculate $\\\\frac{1}{2}$"
```

### ❌ Dollar signs breaking
```json
// WRONG - bare dollar sign
"questionText": "The book costs $15"

// CORRECT - escaped in math mode
"questionText": "The book costs $\\\\$15$"
```

---

## Example Workflow

1. **Create Template**: Copy the example JSON
2. **Modify**: Change title, description, goalId, questions
3. **Validate**: Paste into jsonlint.com, fix any syntax errors
4. **Import**: Upload or paste into Jepson Math
5. **Preview**: Check rendering, especially math
6. **Create**: Save to database
7. **Assign**: Go to goal, assign to students

---

## Need Help?

- Check `assessment-import-template.json` for a complete working example
- Validate JSON syntax at https://jsonlint.com
- Test KaTeX rendering at https://katex.org/
- Contact support for additional question types

---

## Future Enhancements

Coming soon:
- Export existing assessments as JSON
- Bulk import multiple assessments
- Question bank library
- Auto-convert from Google Forms/Canvas
