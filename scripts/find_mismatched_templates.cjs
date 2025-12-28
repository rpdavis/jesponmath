#!/usr/bin/env node

/**
 * Find templates where the exampleQuestion doesn't match the areaOfNeed
 * 
 * Example: areaOfNeed="Math - Elapsed Time" but exampleQuestion is about money
 * 
 * Usage: Run this from the Firebase Console instead
 * Or: Copy paste the main logic into browser console on Firebase Firestore page
 */

console.log('⚠️  This script requires Firebase Admin SDK with service account credentials.')
console.log('📋 Instead, you can run this query directly in the Firebase Console:')
console.log('')
console.log('Or use this browser console version on your Firestore page:\n')
console.log('=' .repeat(80))
console.log(`
// Paste this into browser console on Firebase Firestore Console

function detectTopicFromQuestion(question) {
  const text = (question || '').toLowerCase()
  const patterns = [
    { keywords: ['elapsed time', 'time elapsed', 'what time', 'start time', 'end time', 'began at', 'started at'], topic: 'Elapsed Time' },
    { keywords: ['money', 'dollar', 'cost', 'price', 'purchase', 'buy', 'spend', 'save', 'pay', '$'], topic: 'Money' },
  ]
  for (const { keywords, topic } of patterns) {
    if (keywords.some(k => text.includes(k))) return topic
  }
  return null
}

function detectTopicFromAreaOfNeed(areaOfNeed) {
  const text = (areaOfNeed || '').toLowerCase()
  if (text.includes('elapsed time')) return 'Elapsed Time'
  if (text.includes('money')) return 'Money'
  return null
}

// Get templates and check for mismatches
const templates = await firebase.firestore().collection('goalTemplates').get()
const mismatched = []

templates.forEach(doc => {
  const t = doc.data()
  const qTopic = detectTopicFromQuestion(t.exampleQuestion)
  const aTopic = detectTopicFromAreaOfNeed(t.areaOfNeed)
  
  if (qTopic && aTopic && qTopic !== aTopic) {
    console.log('❌ Mismatch:', doc.id)
    console.log('  Area:', t.areaOfNeed, '→', aTopic)
    console.log('  Question:', (t.exampleQuestion||'').substring(0,60), '→', qTopic)
    mismatched.push({ id: doc.id, aTopic, qTopic })
  }
})

console.log('Total mismatched:', mismatched.length)
`)
console.log('=' .repeat(80))
console.log('')

// Simplified version for terminal  
const db = null

// Topic detection from question content
function detectTopicFromQuestion(question) {
  const text = (question || '').toLowerCase()
  
  const topicPatterns = [
    { keywords: ['elapsed time', 'time elapsed', 'what time', 'start time', 'end time', 'began at', 'started at', 'finish'], topic: 'Elapsed Time' },
    { keywords: ['money', 'dollar', 'cost', 'price', 'purchase', 'buy', 'spend', 'save', 'pay', '$'], topic: 'Money' },
    { keywords: ['fraction', 'fractions', 'numerator', 'denominator', '1/2', '1/4', '3/4'], topic: 'Fractions' },
    { keywords: ['decimal', 'decimals'], topic: 'Decimals' },
    { keywords: ['percent', 'percentage', '%'], topic: 'Percentages' },
    { keywords: ['area', 'perimeter', 'volume', 'length', 'width', 'height'], topic: 'Geometry' },
    { keywords: ['equation', 'solve for', 'variable', 'x =', 'y ='], topic: 'Algebra' },
    { keywords: ['ratio', 'proportion', 'per', 'rate'], topic: 'Ratios & Proportions' },
  ]
  
  for (const { keywords, topic } of topicPatterns) {
    if (keywords.some(k => text.includes(k))) {
      return topic
    }
  }
  
  return null
}

// Topic detection from areaOfNeed
function detectTopicFromAreaOfNeed(areaOfNeed) {
  const text = (areaOfNeed || '').toLowerCase()
  
  if (text.includes('elapsed time')) return 'Elapsed Time'
  if (text.includes('money')) return 'Money'
  if (text.includes('fraction')) return 'Fractions'
  if (text.includes('decimal')) return 'Decimals'
  if (text.includes('percent')) return 'Percentages'
  if (text.includes('geometry') || text.includes('area') || text.includes('perimeter')) return 'Geometry'
  if (text.includes('algebra') || text.includes('equation')) return 'Algebra'
  if (text.includes('ratio') || text.includes('proportion')) return 'Ratios & Proportions'
  
  return null
}

async function findMismatchedTemplates() {
  console.log('🔍 Scanning all templates for mismatches...\n')
  
  const templatesRef = db.collection('goalTemplates')
  const snapshot = await templatesRef.get()
  
  const mismatched = []
  const correct = []
  const unclear = []
  
  for (const doc of snapshot.docs) {
    const template = { id: doc.id, ...doc.data() }
    
    const questionTopic = detectTopicFromQuestion(template.exampleQuestion)
    const areaOfNeedTopic = detectTopicFromAreaOfNeed(template.areaOfNeed)
    
    // Check if we have clear topics for both
    if (!questionTopic && !areaOfNeedTopic) {
      unclear.push({
        id: template.id,
        name: template.name,
        areaOfNeed: template.areaOfNeed,
        exampleQuestion: (template.exampleQuestion || '').substring(0, 80),
        reason: 'Both topics unclear'
      })
      continue
    }
    
    if (!questionTopic) {
      unclear.push({
        id: template.id,
        name: template.name,
        areaOfNeed: template.areaOfNeed,
        exampleQuestion: (template.exampleQuestion || '').substring(0, 80),
        reason: 'Question topic unclear'
      })
      continue
    }
    
    if (!areaOfNeedTopic) {
      unclear.push({
        id: template.id,
        name: template.name,
        areaOfNeed: template.areaOfNeed,
        exampleQuestion: (template.exampleQuestion || '').substring(0, 80),
        reason: 'Area of Need topic unclear'
      })
      continue
    }
    
    // Check for mismatch
    if (questionTopic !== areaOfNeedTopic) {
      mismatched.push({
        id: template.id,
        name: template.name,
        areaOfNeed: template.areaOfNeed,
        areaOfNeedTopic: areaOfNeedTopic,
        exampleQuestion: (template.exampleQuestion || '').substring(0, 80),
        questionTopic: questionTopic,
        isActive: template.isActive,
        usageCount: template.usageCount || 0,
      })
    } else {
      correct.push({
        id: template.id,
        name: template.name,
        topic: questionTopic,
        isActive: template.isActive,
      })
    }
  }
  
  // Print results
  console.log('=' .repeat(80))
  console.log('MISMATCHED TEMPLATES (❌ THESE ARE THE PROBLEM!)')
  console.log('='.repeat(80))
  
  if (mismatched.length === 0) {
    console.log('✅ No mismatched templates found!\n')
  } else {
    for (const t of mismatched) {
      console.log(`\n❌ Template ID: ${t.id}`)
      console.log(`   Name: ${t.name}`)
      console.log(`   Area of Need: "${t.areaOfNeed}" → Detected Topic: "${t.areaOfNeedTopic}"`)
      console.log(`   Example Question: "${t.exampleQuestion}..." → Detected Topic: "${t.questionTopic}"`)
      console.log(`   Active: ${t.isActive}, Usage Count: ${t.usageCount}`)
      console.log(`   🔥 MISMATCH: Area says "${t.areaOfNeedTopic}" but question is about "${t.questionTopic}"`)
    }
    console.log(`\n📊 Total mismatched: ${mismatched.length}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('UNCLEAR TEMPLATES (⚠️  Need manual review)')
  console.log('='.repeat(80))
  
  if (unclear.length === 0) {
    console.log('✅ All templates have clear topics!\n')
  } else {
    for (const t of unclear) {
      console.log(`\n⚠️  Template ID: ${t.id}`)
      console.log(`   Name: ${t.name}`)
      console.log(`   Area of Need: "${t.areaOfNeed}"`)
      console.log(`   Example Question: "${t.exampleQuestion}..."`)
      console.log(`   Reason: ${t.reason}`)
    }
    console.log(`\n📊 Total unclear: ${unclear.length}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log(`✅ CORRECT TEMPLATES: ${correct.length}`)
  console.log('='.repeat(80))
  
  // Offer to deactivate mismatched templates
  if (mismatched.length > 0) {
    console.log('\n🔧 RECOMMENDED ACTIONS:')
    console.log('   1. Run: node scripts/deactivate_mismatched_templates.cjs')
    console.log('   2. Or manually deactivate/delete these templates in Firestore')
    console.log('   3. Then re-generate your assessments')
  }
}

findMismatchedTemplates()
  .then(() => {
    console.log('\n✅ Scan complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error scanning templates:', error)
    process.exit(1)
  })

