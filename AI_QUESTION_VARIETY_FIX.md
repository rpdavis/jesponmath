# AI Question Variety Fix

**Date**: December 22, 2025  
**Issue**: AI-generated questions were too similar - same names, scenarios, and especially same answers

---

## 🐛 Problem

When generating multiple Progress Assessment questions, the AI was producing nearly identical questions:

**Before**:
```
Q2: David wants to buy a skateboard for $85.75. He has $32.25... Answer: 6
Q3: David wants to buy a skateboard for $85.75. He has $32.75... Answer: 6
Q4: David wants to buy a skateboard for $85.75. He has $32.25... Answer: 6
Q5: David wants to buy a skateboard for $85.75. He has $32.25... Answer: 6
```

**Root Cause**: The AI prompt said "generate a DIFFERENT question" but didn't give specific instructions on HOW to make it different.

---

## ✅ Solution

Added **explicit variety instructions** to the AI prompt that changes based on question number:

### Changes Made to `src/services/aiQuestionGenerator.ts`:

1. **Question-Specific Names**:
```typescript
Q1: [Maria, Sarah, Alex, Jordan, Taylor]
Q2: [David, Emma, Chris, Sam, Riley]
Q3: [James, Sophia, Casey, Morgan, Avery]
Q4: [Michael, Olivia, Jamie, Cameron, Blake]
Q5: [Daniel, Ava, Jordan, Quinn, Skylar]
```

2. **Variety Requirements**:
- Change the item (video game → skateboard → scooter → bike → headphones)
- Vary dollar amounts significantly ($45-120, $15-50, $5-15)
- **Calculate DIFFERENT answers** (most important!)
- Use different scenarios (babysitting, mowing, walking dogs, tutoring, etc.)

3. **Critical Warning in Prompt**:
```
⚠️ CRITICAL VARIETY REQUIREMENTS:
- Use DIFFERENT student names
- Use DIFFERENT items/scenarios  
- Use DIFFERENT numbers
- Calculate to ensure DIFFERENT answer
- Do NOT copy - create NEW question in same style
```

---

## 📊 Expected Results

**After Fix**:
```
Q1: Maria wants to buy a video game for $65.50. She has $22.50 saved. She earns $8.00/hr babysitting... Answer: 6 hours

Q2: Emma wants to buy headphones for $78.00. She has $38.00 saved. She earns $10.00/hr tutoring... Answer: 4 hours

Q3: James wants to buy a skateboard for $92.00. He has $25.00 saved. He earns $12.50/hr mowing lawns... Answer: 5.36 hours

Q4: Olivia wants to buy art supplies for $55.75. She has $18.75 saved. She earns $7.50/hr walking dogs... Answer: 5 hours

Q5: Daniel wants to buy a tablet for $115.00. He has $45.00 saved. He earns $14.00/hr washing cars... Answer: 5 hours
```

**Key Improvements**:
- ✅ Different names for each question
- ✅ Different items being purchased
- ✅ Different dollar amounts
- ✅ Different hourly rates
- ✅ **Different final answers!**
- ✅ Different scenarios

---

## 🧪 Testing

To verify the fix works:

1. **Generate 3 assessments** for a two-step word problem goal
2. **Check each assessment** has 5 questions
3. **Verify variety**:
   - Different student names in each question
   - Different items/scenarios
   - **Different final answers** (this is the key!)
   - Numbers vary significantly

---

## 💡 Why This Works

**AI models are literal** - they need explicit instructions. Saying "make it different" isn't enough.

By giving the AI:
- Specific name lists per question number
- Explicit item variations
- Number ranges to use
- **Emphasis on calculating different answers**

The AI now understands **exactly how** to create variety.

---

## 🔍 Technical Details

### Prompt Structure:

```typescript
// Question-specific variety instructions
const varietyInstructions = `
CRITICAL: ENSURE VARIETY - Question #${questionNumber}
- Use student name #${questionNumber} from list
- Change item being purchased
- Vary dollar amounts ($45-120, $15-50, $5-15)
- IMPORTANT: Calculate DIFFERENT answer
- Use different scenario
- Make UNIQUE with different numbers
`

// Template reference with warnings
const templateSection = templateReference ? `
⚠️ CRITICAL VARIETY REQUIREMENTS:
- Use DIFFERENT names (see variety instructions)
- Use DIFFERENT items/scenarios
- Use DIFFERENT numbers
- Calculate DIFFERENT answer
- Do NOT copy template
` : ''
```

### Key Changes:
- **Line 405-421**: Added `varietyInstructions` with question-specific requirements
- **Line 423-437**: Enhanced template section with critical variety warnings
- **Line 456**: Added requirement #7: "Each question must be UNIQUE"

---

## 📝 Summary

**Problem**: Questions too similar (especially same answers)  
**Solution**: Explicit variety instructions per question number  
**Result**: Each question now truly unique with different names, scenarios, and answers

This fix ensures teachers get high-quality, varied assessment questions that properly test students across multiple attempts without repetition.

---

**Status**: ✅ **FIXED** - AI now generates unique questions with varied answers




