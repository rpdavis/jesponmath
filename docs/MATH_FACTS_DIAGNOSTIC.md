# Math Facts Fluency Diagnostic

## Overview
The Math Facts Fluency Diagnostic is a timed assessment similar to Math Fact Lab, designed to measure students' speed and accuracy with basic math facts across four operations: addition, subtraction, multiplication, and division.

## Features

### 🎯 Test Types
The diagnostic offers 7 different test configurations:

1. **All Operations (Mixed)** - 80 questions, 8 minutes
   - 20 addition facts
   - 20 subtraction facts
   - 20 multiplication facts
   - 20 division facts

2. **Addition Facts Only** - 30 questions, 3 minutes
   - Numbers 0-20

3. **Subtraction Facts Only** - 30 questions, 3 minutes
   - Numbers 0-20 (no negative answers)

4. **Multiplication Facts Only** - 30 questions, 3 minutes
   - Numbers 0-12 (times tables)

5. **Division Facts Only** - 30 questions, 3 minutes
   - Numbers 0-12 (division facts)

6. **Addition & Subtraction** - 40 questions, 4 minutes
   - Mixed addition and subtraction

7. **Multiplication & Division** - 40 questions, 4 minutes
   - Mixed multiplication and division

### ⏱️ Timed Assessment
- Each test has a countdown timer
- Timer displays:
  - Blue: Normal time
  - Yellow: Less than 30 seconds warning
  - Red: Less than 10 seconds critical
- Test auto-submits when time expires
- Students can finish early

### 📊 Scoring & Metrics

The diagnostic tracks:
- **Correct Answers**: Number of correct responses
- **Accuracy**: Percentage of correct answers
- **Time Spent**: Total time used
- **Average Time per Question**: Speed metric
- **Questions per Minute**: Fluency rate
- **Operation Breakdown**: Performance by each operation type

### 🏆 Fluency Ratings

Students receive a fluency rating based on accuracy AND speed:

- **Excellent** 🏆
  - 90%+ accuracy AND <3 seconds per question average
  - Outstanding fluency

- **Good** 🎯
  - 80%+ accuracy AND <5 seconds per question average
  - Good fluency

- **Developing** 📈
  - 70%+ accuracy OR <7 seconds per question average
  - Making progress

- **Needs Practice** 💪
  - Below 70% accuracy and/or slow speed
  - Requires regular practice

## How to Use

### For Teachers

1. **Access the Diagnostic**
   - From Teacher Dashboard, click "Math Facts Fluency Test"
   - Or navigate to `/diagnostic/math-facts`

2. **Choose Test Type**
   - Select from 7 pre-configured test types
   - See total questions and time limit for each

3. **Select Assignment Mode**
   - **Single Student (Live)**: Administer test in real-time
   - **Assign to All Students**: Assign to all your students
   - **Assign by Class/Period**: Assign to specific class
   - **Select Multiple Students**: Pick individual students

4. **Start or Assign Test**
   - Live mode: Test starts immediately with timer
   - Assignment mode: Students receive notification and can access from their dashboard

5. **View Results**
   - See detailed breakdown by operation
   - Track fluency rating
   - Monitor average speed
   - Export or print results

### For Students

1. **Access Assigned Test**
   - View from Student Dashboard
   - Click on assigned Math Facts test

2. **Take the Test**
   - Timer starts automatically
   - Type answer in large input box
   - Press Enter or click Submit
   - Can skip questions if needed

3. **View Results**
   - See completion message when done
   - Teacher reviews detailed results

## Question Generation

The diagnostic now includes **strategic question types** to assess true fluency (not just memorization):

### Addition (0-20)
**70% Standard Facts:**
- Random pairs of numbers 0-20
- Example: 7 + 8 = ?

**30% Strategic Questions:**
- **Make-10 Strategy**: Problems that cross 10 (e.g., 8 + 7)
  - Hint: "Think: 8 + 2 = 10, then + 5"
- **Doubles Strategy**: Near-doubles (e.g., 6 + 7)
  - Hint: "Think: 6 + 6 = 12, then add 1"

### Subtraction (0-20)
**70% Standard Facts:**
- Random numbers 0-20 (non-negative results)
- Example: 15 − 7 = ?

**30% Inverse/Fact Family:**
- Tests understanding of inverse relationships
- Example: 15 − 7 = ? with hint "Think: 7 + ? = 15"
- Assesses ability to use addition to solve subtraction

### Multiplication (0-12)
**70% Standard Facts:**
- Times tables 0-12
- Example: 8 × 7 = ?

**30% Fact Family:**
- Tests commutative property understanding
- Example: 7 × 8 = ? with hint "Remember: 7 × 8 = 8 × 7"
- Assesses conceptual understanding

### Division (0-12)
**70% Standard Facts:**
- Division facts 0-12 (no remainders)
- Example: 56 ÷ 7 = ?

**30% Inverse/Multiplication:**
- Tests relationship to multiplication
- Example: 56 ÷ 7 = ? with hint "Think: 7 × ? = 56"
- Assesses understanding that division is inverse of multiplication

## Data Stored

Results are saved to Firestore `diagnosticResults` collection with:
- Student information
- Test type and configuration
- Overall score and accuracy
- Time metrics (total, average, per minute)
- Fluency rating
- Operation breakdown (correct/total for each operation)
- Individual answers with timestamps
- Timestamp of completion

## Best Practices

### For Teachers
1. **Start with Mixed Tests**: Get baseline across all operations
2. **Focus Practice**: Use single-operation tests for targeted practice
3. **Regular Assessment**: Test monthly to track fluency growth
4. **Set Goals**: Aim for "Good" or "Excellent" fluency ratings
5. **Use Results for Grouping**: Group students by operation needs

### For Students
1. **Work Quickly but Accurately**: Speed matters, but accuracy more
2. **Don't Get Stuck**: Skip difficult problems and come back if time
3. **Practice Regularly**: Use the test to identify weak areas
4. **Focus on Facts**: Memorize common facts to improve speed
5. **Stay Calm**: Timer adds pressure but don't rush carelessly

## Technical Details

### Files
- **Component**: `/src/components/diagnostics/MathFactsDiagnostic.vue`
- **Generator**: `/src/utils/mathFactsGenerator.ts`
- **Route**: `/diagnostic/math-facts`

### Dependencies
- Vue 3 Composition API
- Firebase Firestore
- Vue Router
- Auth Store

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly number input

## Future Enhancements
- Practice mode (no timer)
- Difficulty levels (easier/harder number ranges)
- Progress charts over time
- Student-accessible practice mode
- Customizable time limits
- Sound effects and animations
- Competition/leaderboard mode
- Print certificates for achievements

