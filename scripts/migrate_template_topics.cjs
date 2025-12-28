#!/usr/bin/env node

/**
 * Migration Script: Add Topic Field to Existing Templates
 * 
 * This script:
 * 1. Reads all existing goal templates
 * 2. Detects topic from goalTextTemplate or exampleGoal
 * 3. Updates each template with detected topic
 * 
 * Usage:
 *   node scripts/migrate_template_topics.cjs
 */

const admin = require('firebase-admin')
const serviceAccount = require('../service-account-key.json')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

// Topic detection keywords (matching the frontend logic)
const topicKeywords = [
  { keywords: ['elapsed time', 'time elapsed', 'what time', 'start time', 'end time', 'finish', 'began at', 'started at'], topic: 'Elapsed Time' },
  { keywords: ['money', 'dollar', 'cost', 'price', 'purchase', 'buy', 'spend', 'save', 'pay', '$'], topic: 'Money' },
  { keywords: ['fraction', 'fractions', 'numerator', 'denominator', '1/2', '1/4', '3/4'], topic: 'Fractions' },
  { keywords: ['decimal', 'decimals'], topic: 'Decimals' },
  { keywords: ['percent', 'percentage', '%'], topic: 'Percentages' },
  { keywords: ['area', 'perimeter', 'volume', 'geometry', 'length', 'width', 'height'], topic: 'Geometry' },
  { keywords: ['algebra', 'equation', 'variable', 'expression', 'solve for', 'x =', 'y ='], topic: 'Algebra' },
  { keywords: ['ratio', 'proportion', 'per', 'rate'], topic: 'Ratios & Proportions' },
  { keywords: ['measurement', 'measure', 'length', 'weight'], topic: 'Measurement' },
  { keywords: ['graph', 'chart', 'data', 'statistics'], topic: 'Data & Graphs' },
  { keywords: ['reading comprehension', 'main idea', 'inference'], topic: 'Reading Comprehension' },
  { keywords: ['vocabulary', 'word meaning', 'context clue'], topic: 'Vocabulary' },
  { keywords: ['writing', 'essay', 'paragraph'], topic: 'Writing' },
  { keywords: ['grammar', 'punctuation', 'syntax'], topic: 'Grammar' },
]

/**
 * Detect topic from template text
 * PRIORITY 1: Check example question (actual content)
 * PRIORITY 2: Check goal text
 * PRIORITY 3: Fallback based on subject
 */
function detectTopic(template) {
  // PRIORITY 1: Check example question first (the actual question content is most reliable)
  const exampleQuestion = (template.exampleQuestion || '').toLowerCase()
  
  if (exampleQuestion) {
    for (const { keywords, topic } of topicKeywords) {
      if (keywords.some(k => exampleQuestion.includes(k))) {
        return { topic, source: 'exampleQuestion', keyword: keywords.find(k => exampleQuestion.includes(k)) }
      }
    }
  }
  
  // PRIORITY 2: Check goal text and area of need
  const goalText = (template.goalTextTemplate || '').toLowerCase()
  const exampleGoal = (template.exampleGoal || '').toLowerCase()
  const areaOfNeed = (template.areaOfNeed || '').toLowerCase()
  const combinedGoalText = `${goalText} ${exampleGoal} ${areaOfNeed}`

  for (const { keywords, topic } of topicKeywords) {
    if (keywords.some(k => combinedGoalText.includes(k))) {
      return { topic, source: 'goalText', keyword: keywords.find(k => combinedGoalText.includes(k)) }
    }
  }

  // Fallback based on subject
  const subject = template.subject || 'other'
  if (subject === 'math') return { topic: 'Math', source: 'fallback', keyword: null }
  if (subject === 'ela') return { topic: 'Reading/Writing', source: 'fallback', keyword: null }
  return { topic: 'General', source: 'fallback', keyword: null }
}

/**
 * Main migration function
 */
async function migrateTemplates() {
  try {
    console.log('🔍 Fetching all goal templates...\n')
    
    const templatesSnapshot = await db.collection('goalTemplates').get()
    
    if (templatesSnapshot.empty) {
      console.log('ℹ️  No templates found to migrate.')
      return
    }

    console.log(`📊 Found ${templatesSnapshot.size} templates\n`)

    let updatedCount = 0
    let skippedCount = 0

    // Process each template
    for (const doc of templatesSnapshot.docs) {
      const template = doc.data()
      const templateId = doc.id
      const templateName = template.name || 'Unnamed Template'

      // Check if template already has a topic
      if (template.topic && template.topic.trim() !== '') {
        console.log(`⏭️  SKIP: "${templateName}" - already has topic: "${template.topic}"`)
        skippedCount++
        continue
      }

      // Detect topic
      const detection = detectTopic(template)
      
      console.log(`✨ UPDATE: "${templateName}"`)
      console.log(`   Old topic: "${template.topic || '(blank)'}"`)
      console.log(`   New topic: "${detection.topic}"`)
      console.log(`   Detected from: ${detection.source}`)
      if (detection.keyword) {
        console.log(`   Matched keyword: "${detection.keyword}"`)
      }

      // Update template
      await db.collection('goalTemplates').doc(templateId).update({
        topic: detection.topic,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      updatedCount++
      console.log(`   ✅ Updated successfully\n`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('📈 MIGRATION SUMMARY')
    console.log('='.repeat(50))
    console.log(`Total templates: ${templatesSnapshot.size}`)
    console.log(`Updated: ${updatedCount}`)
    console.log(`Skipped (already had topic): ${skippedCount}`)
    console.log('='.repeat(50) + '\n')
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateTemplates()
  .then(() => {
    console.log('\n👋 Exiting...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })

