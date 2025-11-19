# Foundational Fluency System

## Overview
A comprehensive, research-backed math fluency system implementing the framework based on Jordan et al. (2006), Clements & Sarama (2007), Fuson & Briars (1990), and Gersten et al. (2009). This system follows the CRA (Concrete → Representational → Abstract) progression.

## System Architecture

### Four Research-Based Modules

#### 1. **Subitizing** 👁️
**Research Foundation**: Jordan et al., 2006; Clements & Sarama, 2007

**Purpose**: Recognize quantities instantly without counting

**What It Measures**:
- Instant quantity recognition (1-10)
- Visual pattern recognition
- Number sense foundation

**Practice Mode**:
- 20 problems
- Unlimited attempts
- Instant feedback
- Visual hints available
- Three display types: Dice, Dots, Ten Frames

**Assessment Mode**:
- 15 problems
- Timed responses
- Records accuracy + reaction time
- No hints

#### 2. **Making 5** 🖐️
**Research Foundation**: Fuson & Briars, 1990; Gersten et al., 2009

**Purpose**: Mental strategies to complete to 5

**What It Measures**:
- Part-whole relationships
- Composing numbers to 5
- Mental math strategies

**Practice Mode**:
- 15 problems
- Shows 1-4 items visually
- Asks "How many more to make 5?"
- Hints highlight missing items
- Immediate feedback

**Assessment Mode**:
- 12 problems
- Records accuracy + time
- No hints

#### 3. **Making 10** 🔟
**Research Foundation**: Fuson & Briars, 1990; Gersten et al., 2009

**Purpose**: Mental strategies to complete to 10

**What It Measures**:
- Part-whole relationships
- Composing numbers to 10
- Foundation for place value

**Practice Mode**:
- 20 problems
- Shows 1-9 items visually
- Asks "How many more to make 10?"
- Hints show missing items in ten frame
- Immediate feedback

**Assessment Mode**:
- 15 problems
- Records accuracy + time
- Foundation for advanced strategies

#### 4. **Symbolic Fluency** 🔢
**Research Foundation**: Fact families, inverse operations

**Purpose**: Addition & subtraction with numbers (includes Make 10)

**What It Measures**:
- Basic addition facts (0-20)
- Basic subtraction facts (0-20)
- Make 10 strategies (30% of problems)
- Fact families
- Inverse relationships

**Practice Mode**:
- 30 problems
- Numbers only (no visuals)
- Mix of addition/subtraction
- Includes targeted Make 10 problems
- Hints available

**Assessment Mode**:
- 25 problems
- Tracks subskill performance:
  - Making 10
  - Doubles
  - Near doubles
  - Fact families
  - Basic addition/subtraction

## Practice vs. Assessment Modes

### Practice Mode 📚
**Purpose**: Build fluency through repetition and feedback

**Features**:
- ✅ Unlimited attempts
- ✅ Instant feedback (correct/incorrect)
- ✅ Visual hints when struggling
- ✅ No time pressure
- ✅ Must get correct before moving on
- ✅ Focus on learning strategies

**Ideal for**:
- Introducing new concepts
- Building confidence
- Strategy development
- Daily practice sessions

### Assessment Mode 📊
**Purpose**: Measure fluency and identify gaps

**Features**:
- ✅ Fixed number of problems
- ✅ Records response time per problem
- ✅ One attempt per problem
- ✅ Auto-advances (assessment moves forward even if incorrect)
- ✅ Detailed performance analytics
- ✅ Subskill breakdown
- ✅ Fluency score calculation

**Ideal for**:
- IEP baseline data
- Progress monitoring
- Identifying specific skill gaps
- Reporting to stakeholders

## Data Collection & Reporting

### Data Points Captured (Per Problem)
1. **User Answer** - What the student entered
2. **Correct/Incorrect** - Accuracy
3. **Response Time** - Speed (milliseconds)
4. **Subskill Tag** - Specific skill being assessed
5. **Attempts** - Number of tries (practice mode only)
6. **Visual Type** - Display method used

### Performance Metrics

#### Overall Metrics
- **Accuracy Percentage**: `(Correct / Total) × 100`
- **Average Response Time**: Mean time per problem (seconds)
- **Fluency Score**: Combined metric
  ```
  Fluency Score = (Accuracy% × 0.7) + (Speed Score × 0.3)
  Speed Score = max(0, 100 - (avg_time × 10))
  ```

#### Subskill Breakdown (Assessment Mode)
For each subskill:
- Total problems
- Correct answers
- Accuracy percentage
- Average time

Example subskills tracked:
- Subitizing
- Making 5
- Making 10
- Doubles (e.g., 6+6)
- Near doubles (e.g., 6+7)
- Fact families (subtraction as inverse)
- Basic addition
- Basic subtraction

### IEP Integration

**Baseline Data**:
- Run assessment mode for relevant module
- Document accuracy % and avg response time
- Note specific subskill gaps

**Progress Goals Example**:
```
Goal: Increase Making 10 fluency from 60% accuracy 
at 4.2s average to 85% accuracy at 2.5s average 
by [date].

Measurement: Monthly Making 10 assessments
Intervention: Daily Making 10 practice (5 min)
```

**Progress Monitoring**:
- Weekly practice sessions
- Monthly assessments
- Track trends in accuracy and speed
- Adjust instruction based on subskill data

## Visual Display System

### Three Display Types

#### 1. **Ten Frames** (Recommended for Making 5/10)
- 2 rows of 5 cells
- Dots fill left-to-right, top-to-bottom
- Perfect for seeing "5-ness" and "10-ness"
- Hints show empty cells needed

#### 2. **Dice Patterns**
- Standard dice arrangements (1-6)
- Extended patterns for 7-10
- Familiar from games
- Good for subitizing practice

#### 3. **Scattered Dots**
- Random positions
- Requires true subitizing (not counting)
- Most challenging visual format

### Visual Hints (Practice Mode Only)

**For Subitizing**: No hints (defeat the purpose)

**For Making 5/10**: 
- Shows missing items in light gray
- Highlights what needs to be added
- Appears on demand (student clicks "Show Hint")
- Helps students visualize the target

## Implementation Details

### Navigation Flow
```
Module Selection → Mode Selection → Active Problems → Results
        ↓                ↓                 ↓             ↓
   (4 modules)    (Practice/Assess)   (Problem by    (Analytics)
                                       problem)
```

### Problem Generation Logic

**Subitizing**:
```javascript
for each problem:
  number = random(1, 10)
  visualType = random([dice, dots, tenFrame])
  question = "How many do you see?"
  correctAnswer = number
```

**Making 5**:
```javascript
for each problem:
  numberShown = random(1, 4)
  visualType = random([dots, tenFrame, dice])
  question = "How many more to make 5?"
  correctAnswer = 5 - numberShown
```

**Making 10**:
```javascript
for each problem:
  numberShown = random(1, 9)
  visualType = random([dots, tenFrame, dice])
  question = "How many more to make 10?"
  correctAnswer = 10 - numberShown
```

**Symbolic**:
```javascript
for each problem:
  if addition:
    if random() < 0.3:  // 30% Make 10
      first = random(1, 9)
      problem = first + " + ___ = 10"
      correctAnswer = 10 - first
    else:
      first = random(0, 10)
      second = random(0, 20 - first)
      problem = first + " + " + second
      correctAnswer = first + second
  else: // subtraction
    total = random(5, 20)
    subtrahend = random(1, total - 1)
    problem = total + " - " + subtrahend
    correctAnswer = total - subtrahend
```

### Answer Validation
- Accepts 0 as valid answer
- Trims whitespace
- Checks exact match with correct answer
- Immediate feedback in practice mode
- Auto-advance in assessment mode

## Usage Guidelines

### For Teachers

**Starting Out**:
1. Teacher explores Practice Mode first
2. Understand each module's focus
3. Try assessment mode to see data output

**Assigning Practice**:
- Students can use practice mode independently
- Great for morning work, centers, or homework
- No assignment system needed (open access)

**Running Assessments**:
- Use for IEP baseline and progress monitoring
- Run monthly or quarterly
- Compare results over time
- Use subskill data to target instruction

### For Students

**Practice Mode Workflow**:
1. Select a module
2. Choose "Practice Mode"
3. Answer each question
4. Get instant feedback
5. Use hints if stuck
6. Must get correct before moving on
7. Complete all problems to see summary

**Assessment Mode Workflow**:
1. Teacher assigns or student selects
2. Choose "Assessment Mode"
3. Answer as quickly and accurately as possible
4. Problems auto-advance
5. See results at the end with scores

### Best Practices

**Progression**:
1. Start with Subitizing (foundation)
2. Move to Making 5 (smaller target)
3. Progress to Making 10 (key strategy)
4. Advance to Symbolic (application)

**Practice Schedule**:
- 5-10 minutes daily
- Rotate modules throughout week
- Assessment once per month

**Interpreting Results**:
- 85%+ accuracy = proficient
- < 60% accuracy = needs intervention
- High accuracy + slow time = needs fluency practice
- Low accuracy = needs conceptual work

## Technical Implementation

### Files Created
- `/src/utils/foundationalFluencyGenerator.ts` - Problem generation logic
- `/src/components/diagnostics/FoundationalFluency.vue` - Main component
- Route added: `/diagnostic/foundational-fluency`

### Key Features
- SVG-based visual displays
- Responsive design
- Real-time feedback
- Performance tracking
- Detailed analytics
- Mobile-friendly

### Access Control
- Teachers: Full access to all modes
- Students: Access when navigating (practice open, assessment for progress tracking)
- No assignment system currently (but could be added)

## Research Citations

1. **Subitizing**: 
   - Jordan, N. C., Kaplan, D., Locuniak, M. N., & Ramineni, C. (2006). Predicting first-grade math achievement from developmental number sense trajectories.
   - Clements, D. H., & Sarama, J. (2007). Effects of a preschool mathematics curriculum.

2. **Making 5/10**: 
   - Fuson, K. C., & Briars, D. J. (1990). Using a base-ten blocks learning/teaching approach for first- and second-grade place-value and multidigit addition and subtraction.
   - Gersten, R., et al. (2009). Assisting students struggling with mathematics: Response to Intervention (RtI) for elementary and middle schools.

3. **CRA Progression**: Concrete → Representational → Abstract
   - Widely supported in special education and mathematics education research

4. **Fact Families & Inverse Operations**: Standard research-based practice for developing number flexibility

## Future Enhancements (Potential)

### Assignment System
- Teachers assign specific modules to students
- Track completion and results
- Dashboard with class-wide analytics

### Parent Access
- Practice mode available at home
- Progress reports

### Adaptive Practice
- Adjust difficulty based on performance
- Focus on struggling areas automatically

### Additional Modules
- Multiplication/division fact families
- Fraction foundations
- Decimal/percentage sense

### Gamification
- Points and badges for practice
- Class competitions
- Progress streaks

## Accessibility

- Keyboard navigation supported
- Large, clear visuals
- Color-blind friendly palette
- Screen reader compatible (future enhancement)
- Works on tablets and touch devices

---

**Access the system**: https://jepsonmath.web.app/diagnostic/foundational-fluency

**For questions or support**, contact your system administrator.


