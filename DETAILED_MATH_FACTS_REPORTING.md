# Detailed Math Facts Reporting System

## Overview
A comprehensive reporting system that breaks down student performance by specific fact types, ranges, and operations. This allows teachers to identify **exactly** what students need to work on, rather than just seeing overall percentages.

## What's New

### ✅ Detailed Categorization
Every math fact question is now tagged with:
- **Category**: Specific range or type (e.g., "Addition: Sums to 10", "Multiplication: 7s facts")
- **Fact Family**: More specific grouping (e.g., "Doubles (6+6)", "Make 10 (7+3)", "7s")
- **Operation**: Addition, Subtraction, Multiplication, or Division

## Categorization System

### Addition Facts
**Broken down by sum ranges:**
- **Sums to 5**: Basic addition within 5 (e.g., 2+2, 3+1)
- **Sums 6-10**: Addition within 10 (e.g., 4+5, 6+3)
- **Make 10**: Problems that specifically sum to 10 (e.g., 7+3, 6+4)
- **Doubles**: Same number twice (e.g., 5+5, 7+7)
- **Sums 11-15**: Addition crossing 10 (e.g., 8+7, 9+6)
- **Sums 16-20**: Higher sums (e.g., 12+7, 15+4)
- **Sums 20+**: Advanced addition (e.g., 18+9)

### Subtraction Facts
**Broken down by starting number (minuend):**
- **From 0-10**: Basic subtraction (e.g., 7-3, 9-4)
  - Individual tracking: "From 5", "From 8", "From 10", etc.
- **From 11-15**: Intermediate subtraction (e.g., 12-7, 14-6)
- **From 16-20**: Higher subtraction (e.g., 18-9, 20-12)
- **From 20+**: Advanced subtraction (e.g., 25-13)

### Multiplication Facts
**Broken down by specific fact families (0-12):**
- **0s facts**: Zero property (e.g., 0×8, 6×0)
- **1s facts**: Identity property (e.g., 1×7, 9×1)
- **2s facts**: Doubles (e.g., 2×4, 2×9)
- **3s facts**: (e.g., 3×4, 3×8)
- **4s facts**: (e.g., 4×5, 4×9)
- **5s facts**: (e.g., 5×6, 5×9)
- **6s facts**: (e.g., 6×7, 6×9)
- **7s facts**: Often challenging (e.g., 7×8, 7×9)
- **8s facts**: (e.g., 8×9, 8×12)
- **9s facts**: (e.g., 9×7, 9×11)
- **10s facts**: (e.g., 10×6, 10×11)
- **11s facts**: (e.g., 11×7, 11×9)
- **12s facts**: (e.g., 12×8, 12×9)
- **Squares**: Perfect squares (e.g., 5×5, 7×7, 9×9)

**Note**: Multiplication uses the **smaller factor** for categorization, so 3×7 and 7×3 both go into "3s facts" because of the commutative property.

### Division Facts
**Broken down by divisor (what you're dividing by):**
- **÷1**: Identity (e.g., 7÷1, 12÷1)
- **÷2**: (e.g., 14÷2, 24÷2)
- **÷3**: (e.g., 21÷3, 36÷3)
- **÷4**: (e.g., 28÷4, 48÷4)
- **÷5**: (e.g., 35÷5, 60÷5)
- **÷6 through ÷12**: Individual divisors
- **Perfect divisions**: When divisor equals quotient (e.g., 25÷5, 49÷7)

## Results Display

### 1. Overall Summary (Existing)
Shows high-level performance:
- Overall score percentage
- Total time
- Average time per question
- Questions per minute

### 2. Performance by Operation (Existing)
Shows accuracy for each operation:
- Addition: X/Y (Z%)
- Subtraction: X/Y (Z%)
- Multiplication: X/Y (Z%)
- Division: X/Y (Z%)

### 3. **NEW: Detailed Performance Analysis** 🎯
Breaks down each operation into specific fact types:

**Example for Addition:**
```
Addition
├─ Doubles (7+7)         → 100% (3/3) 1.8s avg
├─ Make 10 (6+4)         → 100% (2/2) 2.1s avg
├─ Sums to 5             → 100% (2/2) 1.5s avg
├─ Sums 6-10             → 83%  (5/6) 2.3s avg  💡 Needs Practice
└─ Sums 11-15            → 60%  (3/5) 3.2s avg  💡 Needs Practice
```

**Example for Multiplication:**
```
Multiplication
├─ 2s (doubles)          → 100% (4/4) 1.2s avg
├─ 5s                    → 100% (3/3) 1.5s avg
├─ 3s                    → 80%  (4/5) 2.1s avg  💡 Needs Practice
├─ 7s                    → 50%  (2/4) 3.8s avg  💡 Needs Practice
└─ 9s                    → 33%  (1/3) 4.2s avg  💡 Needs Practice
```

Each fact type card shows:
- **Fact Family Name**: (e.g., "7s", "Doubles", "From 15")
- **Accuracy Percentage**: Color-coded by performance level
- **Correct/Total**: Number correct out of attempts
- **Average Time**: Speed for that specific fact type
- **Visual Progress Bar**: Colored by performance level
- **Recommendation**: "💡 Needs Practice" for low accuracy (<70%)

### 4. **NEW: Priority Practice Areas** 🎯
Shows the **top 5 areas** that need immediate attention:
- Sorted by lowest accuracy first
- Only includes areas with at least 2 attempts
- Shows specific fact family and performance

**Example:**
```
🎯 Priority Practice Areas
⚠️ 9s                     → 33% (1/3)
⚠️ Sums 11-15             → 60% (3/5)
⚠️ 7s                     → 50% (2/4)
⚠️ From 16-20             → 67% (2/3)
⚠️ ÷8s                    → 67% (2/3)
```

## Color Coding System

### Performance Levels
- **🟢 Excellent** (90-100%): Green - Mastery achieved
- **🔵 Good** (80-89%): Blue - Strong understanding
- **🟡 Fair** (70-79%): Yellow - Developing fluency
- **🟠 Needs Improvement** (50-69%): Orange - Requires practice
- **🔴 Critical** (<50%): Red - Urgent intervention needed

### Visual Indicators
Each fact card is:
- **Border colored** by performance level
- **Background tinted** to match
- **Progress bar filled** and colored by accuracy
- **Accuracy percentage** displayed in matching color

## How Teachers Can Use This

### For IEP Goals
**OLD Way:**
> "Improve addition fluency from 65% to 85%"

**NEW Way - More Specific:**
> "Improve addition facts (sums 11-15) from 60% to 85% and Make 10 problems from 67% to 90%"

### For Intervention Planning
1. **Run an assessment** (any of the Core Fluency tests)
2. **Review Detailed Performance Analysis** section
3. **Identify red/orange fact families** (priority areas)
4. **Target those specific facts** in practice sessions
5. **Re-assess monthly** to track progress

### For Progress Monitoring
- **Track specific fact families over time**
- Example: "Student improved 7s facts from 50% (Sept) to 85% (Oct) to 100% (Nov)"
- **Document both accuracy AND speed improvements**

### For Parent Communication
Instead of: "Johnny needs to work on math facts"

Now say: "Johnny has mastered his 2s, 5s, and 10s multiplication facts (100% accuracy) but needs practice with 7s and 9s facts (50% and 33% respectively). I recommend practicing 7s facts for 5 minutes daily."

## Example Report Interpretation

### Scenario: 3rd Grade Student
**Assessment: Core Fluency - Multiplication (0-12)**

**Results:**
- Overall: 76% (19/25 correct)
- Detailed Breakdown:
  - 2s: 100% (3/3) ✅
  - 5s: 100% (3/3) ✅
  - 3s: 100% (2/2) ✅
  - 4s: 100% (2/2) ✅
  - 6s: 75% (3/4) ⚠️
  - 7s: 50% (2/4) 🚨
  - 8s: 67% (2/3) ⚠️
  - 9s: 33% (1/3) 🚨

**Teacher Interpretation:**
1. ✅ **Mastered**: 2s, 3s, 4s, 5s facts
2. ⚠️ **Developing**: 6s, 8s facts (need reinforcement)
3. 🚨 **Priority**: 7s and 9s facts (urgent intervention)

**Action Plan:**
1. Daily 7s and 9s practice (5 min)
2. Use manipulatives/skip counting for 7s
3. Teach 9s finger trick strategy
4. Re-assess in 2 weeks
5. Goal: 80%+ on all fact families by end of month

## Technical Details

### Data Collection
For each question answered:
- Stores: `category`, `factFamily`, `operation`
- Tracks: `accuracy`, `timeSpent`, `correct/incorrect`

### Analysis Algorithm
1. **Group answers by category and fact family**
2. **Calculate accuracy percentage** for each group
3. **Calculate average response time** for each group
4. **Sort by operation, then by accuracy** (lowest first)
5. **Identify priority areas** (< 70% with ≥2 attempts)
6. **Display in organized, color-coded format**

### Report Generation
- Automatically generated after test completion
- No additional teacher action required
- Can be saved/printed for records
- Data can inform next assignment selection

## Best Practices

### For Teachers
1. **Start broad**: Use "All Operations" tests to identify weak operations
2. **Drill down**: Use operation-specific tests to find exact gaps
3. **Target practice**: Focus on 2-3 priority fact families at a time
4. **Re-assess regularly**: Monthly checks to track progress
5. **Celebrate wins**: Acknowledge when fact families move from red → yellow → green

### For Students
- **Green facts**: Review occasionally to maintain fluency
- **Yellow/Orange facts**: Practice 2-3 times per week
- **Red facts**: Daily focused practice (5-10 minutes)

### For Progress Monitoring
**Track over time:**
```
September:  7s = 50% (2/4)
October:    7s = 75% (6/8)
November:   7s = 90% (9/10)
December:   7s = 100% (10/10) ✅ MASTERED!
```

## Accessing Reports

1. **Teacher assigns test** (any Core Fluency assessment)
2. **Student completes test**
3. **System automatically generates detailed report**
4. **Teacher reviews "Detailed Performance Analysis" section**
5. **Identifies priority areas**
6. **Plans targeted intervention**

---

## Summary

This detailed reporting system transforms vague "needs to work on multiplication" feedback into specific, actionable insights like "needs daily practice on 7s and 9s multiplication facts."

**Key Benefits:**
- ✅ **Specific targets** for intervention
- ✅ **Data-driven instruction**
- ✅ **Track granular progress**
- ✅ **Communicate clearly** with parents/IEP teams
- ✅ **Efficient practice** (no wasting time on mastered facts)

**URL**: https://jepsonmath.web.app/diagnostic/math-facts

**For questions**, contact your system administrator.


