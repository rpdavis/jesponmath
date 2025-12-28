/**
 * Fix Corrupted Fluency Data from Round 2 Bug
 *
 * This script fixes proficiency data corrupted by the Round 2 scoring bug
 * that marked all answers as incorrect between Dec 21-22, 2024.
 *
 * What it does:
 * 1. Clears corrupted last5Attempts arrays
 * 2. Resets problem proficiency levels based on total accuracy
 * 3. Preserves student's current sub-level and overall progress
 * 4. Does NOT delete any session records
 *
 * Usage:
 * node scripts/fixCorruptedFluencyData.cjs <studentUid> <operation>
 *
 * Example:
 * node scripts/fixCorruptedFluencyData.cjs 3b5iRWb0vSQgINTxPeVr0bloth13 addition
 */

const admin = require('firebase-admin')
const path = require('path')

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../jepsonmath-firebase-adminsdk.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
  })
}

const db = admin.firestore()

// Get command line arguments
const studentUid = process.argv[2]
const operation = process.argv[3] || 'addition'

if (!studentUid) {
  console.error('❌ Error: Student UID required')
  console.log('Usage: node scripts/fixCorruptedFluencyData.cjs <studentUid> <operation>')
  console.log(
    'Example: node scripts/fixCorruptedFluencyData.cjs 3b5iRWb0vSQgINTxPeVr0bloth13 addition',
  )
  process.exit(1)
}

async function fixCorruptedData() {
  console.log('🔧 Starting data cleanup...')
  console.log(`   Student: ${studentUid}`)
  console.log(`   Operation: ${operation}`)
  console.log('')

  try {
    // Get the progress document
    const docId = `${studentUid}_${operation}`
    const docRef = db.collection('mathFluencyProgress').doc(docId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.error('❌ No progress document found for this student/operation')
      process.exit(1)
    }

    const data = docSnap.data()
    console.log('📊 Current Progress:')
    console.log(`   Sub-Level: ${data.currentSubLevel}`)
    console.log(`   Proficiency: ${data.proficiencyPercentage}%`)
    console.log(`   Practice Days: ${data.totalPracticeDays}`)
    console.log('')

    // Analyze problem banks
    const banks = data.problemBanks
    let totalProblems = 0
    let fixedProblems = 0
    let promotedProblems = 0
    let unchangedProblems = 0

    console.log('🔍 Analyzing problem banks...')
    console.log(`   Doesn't Know: ${banks.doesNotKnow?.length || 0}`)
    console.log(`   Emerging: ${banks.emerging?.length || 0}`)
    console.log(`   Approaching: ${banks.approaching?.length || 0}`)
    console.log(`   Proficient: ${banks.proficient?.length || 0}`)
    console.log(`   Mastered: ${banks.mastered?.length || 0}`)
    console.log('')

    // Process each bank
    const allBanks = ['doesNotKnow', 'emerging', 'approaching', 'proficient', 'mastered']
    const promotionMap = {} // Track which bank each problem should move to

    for (const bankName of allBanks) {
      const problems = banks[bankName] || []
      totalProblems += problems.length

      for (const problem of problems) {
        // Calculate true accuracy from total attempts
        const totalAttempts = problem.totalAttempts || 0
        const correctAttempts = problem.correctAttempts || 0
        const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0

        // Determine appropriate proficiency level based on overall accuracy
        let newLevel = bankName

        if (totalAttempts >= 5) {
          if (accuracy >= 0.95) {
            newLevel = 'mastered'
          } else if (accuracy >= 0.85) {
            newLevel = 'proficient'
          } else if (accuracy >= 0.7) {
            newLevel = 'approaching'
          } else if (accuracy >= 0.5) {
            newLevel = 'emerging'
          } else {
            newLevel = 'doesNotKnow'
          }
        }

        // Clear corrupted last5Attempts
        problem.last5Attempts = []

        // Update proficiency calculation
        problem.proficiencyCalculation = {
          correctOutOfLast5: 0,
          averageTimeOfLast5: 0,
          last5Trend: 'stable',
          confidenceLevel: totalAttempts < 5 ? 'low' : totalAttempts < 10 ? 'medium' : 'high',
        }

        // Track if level changed
        if (newLevel !== bankName) {
          if (!promotionMap[newLevel]) promotionMap[newLevel] = []
          promotionMap[newLevel].push({
            problem,
            oldBank: bankName,
            accuracy: Math.round(accuracy * 100),
            totalAttempts,
          })
          promotedProblems++
        } else {
          unchangedProblems++
        }

        fixedProblems++
      }
    }

    // Move promoted problems to correct banks
    for (const [targetBank, problemList] of Object.entries(promotionMap)) {
      for (const { problem, oldBank } of problemList) {
        // Remove from old bank
        banks[oldBank] = banks[oldBank].filter((p) => p.problemId !== problem.problemId)

        // Add to new bank
        problem.proficiencyLevel = targetBank
        if (!banks[targetBank]) banks[targetBank] = []
        banks[targetBank].push(problem)
      }
    }

    // Recalculate distribution
    const distribution = {
      doesNotKnow: banks.doesNotKnow?.length || 0,
      emerging: banks.emerging?.length || 0,
      approaching: banks.approaching?.length || 0,
      proficient: banks.proficient?.length || 0,
      mastered: banks.mastered?.length || 0,
      total: totalProblems,
    }

    const newProficiency = Math.round(
      ((distribution.approaching + distribution.proficient + distribution.mastered) /
        distribution.total) *
        100,
    )

    console.log('✅ Data Cleanup Complete!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   Total problems processed: ${totalProblems}`)
    console.log(`   Problems fixed: ${fixedProblems}`)
    console.log(`   Problems promoted: ${promotedProblems}`)
    console.log(`   Problems unchanged: ${unchangedProblems}`)
    console.log('')

    console.log('📈 New Distribution:')
    console.log(`   Doesn't Know: ${distribution.doesNotKnow}`)
    console.log(`   Emerging: ${distribution.emerging}`)
    console.log(`   Approaching: ${distribution.approaching}`)
    console.log(`   Proficient: ${distribution.proficient}`)
    console.log(`   Mastered: ${distribution.mastered}`)
    console.log('')

    console.log(`   Old Proficiency: ${data.proficiencyPercentage}%`)
    console.log(`   New Proficiency: ${newProficiency}%`)
    console.log('')

    // Show promotion details
    if (promotedProblems > 0) {
      console.log('🎯 Promoted Problems:')
      for (const [targetBank, problemList] of Object.entries(promotionMap)) {
        console.log(`   To ${targetBank}:`)
        for (const { problem, oldBank, accuracy, totalAttempts } of problemList) {
          console.log(
            `      ${problem.displayText} (${oldBank} → ${targetBank}, ${accuracy}% over ${totalAttempts} attempts)`,
          )
        }
      }
      console.log('')
    }

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    readline.question('Save these changes to Firestore? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        // Update Firestore
        await docRef.update({
          problemBanks: banks,
          proficiencyDistribution: distribution,
          proficiencyPercentage: newProficiency,
          lastModified: admin.firestore.Timestamp.now(),
        })

        console.log('')
        console.log('💾 Changes saved to Firestore!')
        console.log(`   Document: ${docId}`)
        console.log('')
        console.log('✅ Data cleanup complete!')
        console.log('')
        console.log('Next steps:')
        console.log('1. Student continues daily practice')
        console.log('2. New correct answers will rebuild last5Attempts arrays')
        console.log('3. Proficiency will stabilize over next 1-2 sessions')
      } else {
        console.log('')
        console.log('❌ Changes NOT saved. Exiting.')
      }

      readline.close()
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixCorruptedData()



