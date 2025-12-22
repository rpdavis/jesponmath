# Quick Fix for Corrupted Fluency Data (Browser Console)

## Problem
The Round 2 scoring bug created false negatives in `last5Attempts` arrays, causing incorrect proficiency percentages.

## Quick Fix (Run in Browser Console)

### Step 1: Open the student's fluency progress page
Navigate to: `/fluency/progress` as the affected student

### Step 2: Open browser console
Press F12 or Cmd+Option+I

### Step 3: Run this script

```javascript
// QUICK FIX: Clear corrupted last5Attempts and recalculate proficiency
async function fixCorruptedFluencyData() {
  const { db } = await import('./firebase/config')
  const { doc, getDoc, updateDoc, Timestamp } = await import('firebase/firestore')
  
  // Get current user (must be logged in as the student)
  const currentUserUid = '3b5iRWb0vSQgINTxPeVr0bloth13' // REPLACE with actual student UID
  const operation = 'addition'
  
  console.log('🔧 Starting data cleanup...')
  
  try {
    // Get progress document
    const docId = `${currentUserUid}_${operation}`
    const docRef = doc(db, 'mathFluencyProgress', docId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      console.error('❌ No progress found')
      return
    }
    
    const data = docSnap.data()
    const banks = data.problemBanks
    
    console.log('📊 Before:', {
      proficiency: data.proficiencyPercentage + '%',
      doesNotKnow: banks.doesNotKnow?.length || 0,
      emerging: banks.emerging?.length || 0,
      approaching: banks.approaching?.length || 0,
      proficient: banks.proficient?.length || 0,
      mastered: banks.mastered?.length || 0
    })
    
    let promoted = 0
    const promotionMap = {}
    
    // Process each bank
    for (const bankName of ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered']) {
      const problems = banks[bankName] || []
      
      for (const problem of problems) {
        // Clear corrupted last5Attempts
        problem.last5Attempts = []
        problem.proficiencyCalculation = {
          correctOutOfLast5: 0,
          averageTimeOfLast5: 0,
          last5Trend: 'stable',
          confidenceLevel: problem.totalAttempts < 5 ? 'low' : problem.totalAttempts < 10 ? 'medium' : 'high'
        }
        
        // Recalculate level based on total accuracy
        const totalAttempts = problem.totalAttempts || 0
        const correctAttempts = problem.correctAttempts || 0
        const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0
        
        let newLevel = bankName
        if (totalAttempts >= 5) {
          if (accuracy >= 0.95) newLevel = 'mastered'
          else if (accuracy >= 0.85) newLevel = 'proficient'
          else if (accuracy >= 0.70) newLevel = 'approaching'
          else if (accuracy >= 0.50) newLevel = 'emerging'
          else newLevel = 'doesNotKnow'
        }
        
        if (newLevel !== bankName) {
          if (!promotionMap[newLevel]) promotionMap[newLevel] = []
          promotionMap[newLevel].push({ problem, oldBank: bankName })
          promoted++
        }
      }
    }
    
    // Move promoted problems
    for (const [targetBank, problemList] of Object.entries(promotionMap)) {
      for (const { problem, oldBank } of problemList) {
        banks[oldBank] = banks[oldBank].filter(p => p.problemId !== problem.problemId)
        problem.proficiencyLevel = targetBank
        if (!banks[targetBank]) banks[targetBank] = []
        banks[targetBank].push(problem)
      }
    }
    
    // Recalculate distribution
    const total = (banks.doesNotKnow?.length || 0) + (banks.emerging?.length || 0) + 
                  (banks.approaching?.length || 0) + (banks.proficient?.length || 0) + 
                  (banks.mastered?.length || 0)
    
    const distribution = {
      doesNotKnow: banks.doesNotKnow?.length || 0,
      emerging: banks.emerging?.length || 0,
      approaching: banks.approaching?.length || 0,
      proficient: banks.proficient?.length || 0,
      mastered: banks.mastered?.length || 0,
      total
    }
    
    const newProficiency = Math.round(
      ((distribution.approaching + distribution.proficient + distribution.mastered) / total) * 100
    )
    
    console.log('📈 After:', {
      proficiency: newProficiency + '%',
      doesNotKnow: distribution.doesNotKnow,
      emerging: distribution.emerging,
      approaching: distribution.approaching,
      proficient: distribution.proficient,
      mastered: distribution.mastered,
      promoted: promoted
    })
    
    // Save to Firestore
    await updateDoc(docRef, {
      problemBanks: banks,
      proficiencyDistribution: distribution,
      proficiencyPercentage: newProficiency,
      lastModified: Timestamp.now()
    })
    
    console.log('✅ Data cleaned and saved!')
    console.log('Reload the page to see updated proficiency.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the fix
fixCorruptedFluencyData()
```

### Step 4: Verify
- Reload the page
- Check the individual fact breakdown
- Proficiency percentages should now reflect total accuracy

## What This Does

1. ✅ Clears corrupted `last5Attempts` arrays
2. ✅ Recalculates proficiency levels based on **total** correct/incorrect ratio (not just last 5)
3. ✅ Promotes problems that were incorrectly demoted
4. ✅ Preserves student's current sub-level and streak
5. ✅ Saves changes to Firestore

## Promotion Logic

- **95%+ accuracy** → Mastered
- **85-94% accuracy** → Proficient
- **70-84% accuracy** → Approaching
- **50-69% accuracy** → Emerging
- **<50% accuracy** → Doesn't Know

This uses **lifetime accuracy** instead of just the last 5 attempts, which is more forgiving for problems affected by the bug.
