#!/usr/bin/env node

/**
 * Analyze Goals for Template System
 *
 * This script analyzes all goals in Firestore to identify patterns for:
 * - Common topics (equations, fractions, reading comprehension, etc.)
 * - Grade levels distribution
 * - Areas of need patterns
 * - Threshold/degree patterns (e.g., "80% accuracy", "2 out of 3 trials")
 * - Conditions (e.g., "when given notes", "with support")
 * - Standards distribution
 * - Math vs ELA breakdown
 * - Common phrases and keywords
 *
 * Usage: node scripts/analyzeGoalsForTemplates.cjs
 */

const admin = require('firebase-admin')

// Try to load service account, but allow for alternative auth methods
let serviceAccount
try {
  serviceAccount = require('../jepsonmath-firebase-adminsdk.json')
} catch (e) {
  // Try alternative path
  try {
    serviceAccount = require('./jepsonmath-firebase-adminsdk.json')
  } catch (e2) {
    // Check if using environment variable
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('📝 Using credentials from GOOGLE_APPLICATION_CREDENTIALS')
      // Firebase Admin will automatically use the env var
    } else {
      console.log('⚠️  Could not load service account file.')
      console.log('   Please ensure you have one of:')
      console.log('   1. jepsonmath-firebase-adminsdk.json in project root')
      console.log('   2. GOOGLE_APPLICATION_CREDENTIALS environment variable set')
      process.exit(1)
    }
  }
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } else {
    // Use default credentials (from GOOGLE_APPLICATION_CREDENTIALS env var)
    admin.initializeApp()
  }
}

const db = admin.firestore()

// Analysis data structures
const analysis = {
  totalGoals: 0,
  gradeLevels: {},
  areasOfNeed: {},
  standards: {},
  subjects: { math: 0, ela: 0, other: 0 },
  topics: {},
  thresholds: [],
  conditions: [],
  commonPhrases: {},
  goalTitles: [],
  goalTexts: [],
  hasBaseline: 0,
  hasStandard: 0,
  hasGradeLevel: 0,
  activeGoals: 0,
  archivedGoals: 0,
  metGoals: 0,
}

// Keywords for topic detection
const mathKeywords = {
  equation: ['equation', 'equations', 'solve', 'solving', 'two-step', 'multi-step', 'one-step'],
  fraction: ['fraction', 'fractions', 'numerator', 'denominator', 'improper', 'mixed number'],
  decimal: ['decimal', 'decimals', 'decimal point'],
  'whole number': ['whole number', 'whole numbers', 'integer', 'integers'],
  'rational number': ['rational number', 'rational numbers'],
  addition: ['add', 'addition', 'adding', 'sum', 'plus'],
  subtraction: ['subtract', 'subtraction', 'subtracting', 'difference', 'minus'],
  multiplication: ['multiply', 'multiplication', 'multiplying', 'product', 'times'],
  division: ['divide', 'division', 'dividing', 'quotient'],
  'word problem': ['word problem', 'word problems', 'story problem', 'real-world'],
  algebra: ['algebra', 'algebraic', 'variable', 'variables', 'expression', 'expressions'],
  geometry: ['geometry', 'geometric', 'area', 'perimeter', 'volume', 'angle', 'angles'],
  measurement: ['measure', 'measurement', 'unit', 'units', 'convert', 'conversion'],
}

const elaKeywords = {
  'reading comprehension': ['reading comprehension', 'comprehend', 'understand text', 'reading'],
  vocabulary: ['vocabulary', 'word meaning', 'define', 'definition'],
  writing: ['writing', 'write', 'compose', 'composition', 'essay'],
  grammar: ['grammar', 'grammatical', 'sentence structure', 'punctuation'],
  phonics: ['phonics', 'phonetic', 'sound', 'sounds', 'decode', 'decoding'],
}

// Extract threshold patterns (e.g., "80%", "2 out of 3", "4/5")
function extractThresholds(text) {
  const thresholds = []
  const lowerText = text.toLowerCase()

  // Percentage patterns: "80%", "75 percent", etc.
  const percentMatches = lowerText.match(/(\d+)%|(\d+)\s*percent/gi)
  if (percentMatches) {
    percentMatches.forEach((match) => {
      const num = parseInt(match.match(/\d+/)[0])
      thresholds.push({ type: 'percentage', value: num, text: match })
    })
  }

  // "X out of Y" patterns: "2 out of 3", "4 out of 5"
  const outOfMatches = lowerText.match(/(\d+)\s+out\s+of\s+(\d+)/gi)
  if (outOfMatches) {
    outOfMatches.forEach((match) => {
      const parts = match.match(/(\d+)\s+out\s+of\s+(\d+)/i)
      thresholds.push({ type: 'outOf', value: `${parts[1]}/${parts[2]}`, text: match })
    })
  }

  // Fraction patterns: "4/5", "3/4"
  const fractionMatches = lowerText.match(/(\d+)\/(\d+)/g)
  if (fractionMatches) {
    fractionMatches.forEach((match) => {
      thresholds.push({ type: 'fraction', value: match, text: match })
    })
  }

  return thresholds
}

// Extract condition patterns (e.g., "when given notes", "with support")
function extractConditions(text) {
  const conditions = []
  const lowerText = text.toLowerCase()

  const conditionPatterns = [
    /when given (.+?)(?:,|\.|$)/gi,
    /with (.+?)(?:support|assistance|help|modeling|notes|visual|prompt)/gi,
    /given (.+?)(?:,|\.|$)/gi,
    /using (.+?)(?:,|\.|$)/gi,
    /with the (.+?)(?:of|,|\.|$)/gi,
  ]

  conditionPatterns.forEach((pattern) => {
    const matches = lowerText.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].length > 3 && match[1].length < 50) {
        conditions.push(match[1].trim())
      }
    }
  })

  return [...new Set(conditions)] // Remove duplicates
}

// Detect topic from text
function detectTopic(text, keywords) {
  const lowerText = text.toLowerCase()
  const matches = []

  for (const [topic, keys] of Object.entries(keywords)) {
    for (const key of keys) {
      if (lowerText.includes(key)) {
        matches.push(topic)
        break
      }
    }
  }

  return matches
}

// Extract common phrases (2-4 word phrases)
function extractPhrases(text) {
  const phrases = new Set()
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)

  // 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.add(`${words[i]} ${words[i + 1]}`)
  }

  // 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  }

  return Array.from(phrases)
}

// Detect subject (math, ela, other)
function detectSubject(goal) {
  const text = `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`.toLowerCase()

  const mathIndicators = [
    'math',
    'mathematics',
    'number',
    'equation',
    'fraction',
    'decimal',
    'add',
    'subtract',
    'multiply',
    'divide',
    'algebra',
    'geometry',
    'measurement',
  ]
  const elaIndicators = [
    'reading',
    'writing',
    'comprehension',
    'vocabulary',
    'grammar',
    'phonics',
    'literature',
    'text',
    'essay',
    'spelling',
  ]

  const hasMath = mathIndicators.some((ind) => text.includes(ind))
  const hasEla = elaIndicators.some((ind) => text.includes(ind))

  if (hasMath && !hasEla) return 'math'
  if (hasEla && !hasMath) return 'ela'
  if (hasMath && hasEla) return 'other' // Could be both
  return 'other'
}

async function analyzeGoals() {
  console.log('🔍 Starting goal analysis...\n')

  try {
    // Get all goals
    const goalsSnapshot = await db.collection('goals').get()
    analysis.totalGoals = goalsSnapshot.size

    console.log(`📊 Found ${analysis.totalGoals} goals to analyze\n`)

    if (analysis.totalGoals === 0) {
      console.log('⚠️  No goals found in database.')
      return
    }

    // Analyze each goal
    goalsSnapshot.forEach((doc) => {
      const goal = doc.data()

      // Basic stats
      if (goal.isActive && !goal.isArchived && !goal.isMet) analysis.activeGoals++
      if (goal.isArchived) analysis.archivedGoals++
      if (goal.isMet) analysis.metGoals++
      if (goal.baseline) analysis.hasBaseline++
      if (goal.standard) analysis.hasStandard++
      if (goal.gradeLevel) analysis.hasGradeLevel++

      // Grade levels
      if (goal.gradeLevel) {
        analysis.gradeLevels[goal.gradeLevel] = (analysis.gradeLevels[goal.gradeLevel] || 0) + 1
      }

      // Areas of need
      if (goal.areaOfNeed) {
        analysis.areasOfNeed[goal.areaOfNeed] = (analysis.areasOfNeed[goal.areaOfNeed] || 0) + 1
      }

      // Standards
      if (goal.standard) {
        analysis.standards[goal.standard] = (analysis.standards[goal.standard] || 0) + 1
      }

      // Subject detection
      const subject = detectSubject(goal)
      analysis.subjects[subject]++

      // Topic detection
      const combinedText =
        `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`.toLowerCase()
      const mathTopics = detectTopic(combinedText, mathKeywords)
      const elaTopics = detectTopic(combinedText, elaKeywords)

      mathTopics.forEach((topic) => {
        analysis.topics[topic] = (analysis.topics[topic] || 0) + 1
      })

      elaTopics.forEach((topic) => {
        analysis.topics[topic] = (analysis.topics[topic] || 0) + 1
      })

      // Extract thresholds
      const thresholds = extractThresholds(goal.goalText || '')
      analysis.thresholds.push(...thresholds)

      // Extract conditions
      const conditions = extractConditions(goal.goalText || '')
      analysis.conditions.push(...conditions)

      // Extract phrases
      const phrases = extractPhrases(goal.goalText || '')
      phrases.forEach((phrase) => {
        analysis.commonPhrases[phrase] = (analysis.commonPhrases[phrase] || 0) + 1
      })

      // Store titles and texts for pattern analysis
      if (goal.goalTitle) analysis.goalTitles.push(goal.goalTitle)
      if (goal.goalText) analysis.goalTexts.push(goal.goalText)
    })

    // Generate report
    generateReport()
  } catch (error) {
    console.error('❌ Error analyzing goals:', error)
    process.exit(1)
  }
}

function generateReport() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('           GOAL ANALYSIS REPORT FOR TEMPLATES')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Basic Statistics
  console.log('📊 BASIC STATISTICS')
  console.log('───────────────────────────────────────────────────────────')
  console.log(`Total Goals: ${analysis.totalGoals}`)
  console.log(`Active Goals: ${analysis.activeGoals}`)
  console.log(`Archived Goals: ${analysis.archivedGoals}`)
  console.log(`Met Goals: ${analysis.metGoals}`)
  console.log(
    `Goals with Baseline: ${analysis.hasBaseline} (${Math.round((analysis.hasBaseline / analysis.totalGoals) * 100)}%)`,
  )
  console.log(
    `Goals with Standard: ${analysis.hasStandard} (${Math.round((analysis.hasStandard / analysis.totalGoals) * 100)}%)`,
  )
  console.log(
    `Goals with Grade Level: ${analysis.hasGradeLevel} (${Math.round((analysis.hasGradeLevel / analysis.totalGoals) * 100)}%)`,
  )
  console.log('')

  // Subject Breakdown
  console.log('📚 SUBJECT BREAKDOWN')
  console.log('───────────────────────────────────────────────────────────')
  Object.entries(analysis.subjects).forEach(([subject, count]) => {
    const percentage = Math.round((count / analysis.totalGoals) * 100)
    console.log(`${subject.toUpperCase()}: ${count} (${percentage}%)`)
  })
  console.log('')

  // Grade Level Distribution
  console.log('🎓 GRADE LEVEL DISTRIBUTION')
  console.log('───────────────────────────────────────────────────────────')
  const sortedGrades = Object.entries(analysis.gradeLevels).sort(
    (a, b) => parseInt(a[0]) - parseInt(b[0]),
  )
  sortedGrades.forEach(([grade, count]) => {
    const percentage = Math.round((count / analysis.totalGoals) * 100)
    console.log(`Grade ${grade}: ${count} (${percentage}%)`)
  })
  if (sortedGrades.length === 0) {
    console.log('No grade levels specified in goals.')
  }
  console.log('')

  // Top Areas of Need
  console.log('🎯 TOP AREAS OF NEED (Top 15)')
  console.log('───────────────────────────────────────────────────────────')
  const sortedAreas = Object.entries(analysis.areasOfNeed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
  sortedAreas.forEach(([area, count], index) => {
    const percentage = Math.round((count / analysis.totalGoals) * 100)
    console.log(`${(index + 1).toString().padStart(2)}. ${area}: ${count} (${percentage}%)`)
  })
  console.log('')

  // Top Topics
  console.log('📖 TOP TOPICS DETECTED (Top 20)')
  console.log('───────────────────────────────────────────────────────────')
  const sortedTopics = Object.entries(analysis.topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  sortedTopics.forEach(([topic, count], index) => {
    const percentage = Math.round((count / analysis.totalGoals) * 100)
    console.log(`${(index + 1).toString().padStart(2)}. ${topic}: ${count} (${percentage}%)`)
  })
  console.log('')

  // Top Standards
  console.log('📋 TOP STANDARDS (Top 15)')
  console.log('───────────────────────────────────────────────────────────')
  const sortedStandards = Object.entries(analysis.standards)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
  sortedStandards.forEach(([standard, count], index) => {
    const percentage = Math.round((count / analysis.totalGoals) * 100)
    console.log(`${(index + 1).toString().padStart(2)}. ${standard}: ${count} (${percentage}%)`)
  })
  if (sortedStandards.length === 0) {
    console.log('No standards specified in goals.')
  }
  console.log('')

  // Threshold Patterns
  console.log('📈 THRESHOLD PATTERNS')
  console.log('───────────────────────────────────────────────────────────')
  const thresholdCounts = {}
  analysis.thresholds.forEach((t) => {
    const key = `${t.type}:${t.value}`
    thresholdCounts[key] = (thresholdCounts[key] || 0) + 1
  })
  const sortedThresholds = Object.entries(thresholdCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  sortedThresholds.forEach(([key, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${key}: ${count} occurrences`)
  })
  if (sortedThresholds.length === 0) {
    console.log('No threshold patterns detected.')
  }
  console.log('')

  // Common Conditions
  console.log('🔧 COMMON CONDITIONS (Top 15)')
  console.log('───────────────────────────────────────────────────────────')
  const conditionCounts = {}
  analysis.conditions.forEach((c) => {
    conditionCounts[c] = (conditionCounts[c] || 0) + 1
  })
  const sortedConditions = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
  sortedConditions.forEach(([condition, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. "${condition}": ${count} occurrences`)
  })
  if (sortedConditions.length === 0) {
    console.log('No condition patterns detected.')
  }
  console.log('')

  // Common Phrases
  console.log('💬 COMMON PHRASES (Top 20)')
  console.log('───────────────────────────────────────────────────────────')
  const sortedPhrases = Object.entries(analysis.commonPhrases)
    .filter(([phrase, count]) => count >= 2) // Only show phrases that appear at least twice
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  sortedPhrases.forEach(([phrase, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. "${phrase}": ${count} occurrences`)
  })
  console.log('')

  // Sample Goal Titles
  console.log('📝 SAMPLE GOAL TITLES (First 10)')
  console.log('───────────────────────────────────────────────────────────')
  analysis.goalTitles.slice(0, 10).forEach((title, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${title}`)
  })
  console.log('')

  // Recommendations
  console.log('═══════════════════════════════════════════════════════════')
  console.log('           TEMPLATE SYSTEM RECOMMENDATIONS')
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('🎯 PRIORITY TEMPLATES TO CREATE:')
  console.log('───────────────────────────────────────────────────────────')
  const topTopics = sortedTopics.slice(0, 10)
  topTopics.forEach(([topic, count], index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${topic.toUpperCase()} (${count} goals)`)
  })
  console.log('')

  console.log('📊 TEMPLATE COMPONENTS TO CONSIDER:')
  console.log('───────────────────────────────────────────────────────────')
  console.log('1. Topic: Based on detected topics above')
  console.log(
    '2. Grade Level: Most common grades are:',
    sortedGrades
      .slice(0, 3)
      .map(([g]) => `Grade ${g}`)
      .join(', '),
  )
  console.log(
    '3. Threshold: Common patterns:',
    sortedThresholds
      .slice(0, 3)
      .map(([t]) => t.split(':')[1])
      .join(', '),
  )
  console.log(
    '4. Condition: Common conditions:',
    sortedConditions
      .slice(0, 3)
      .map(([c]) => `"${c}"`)
      .join(', '),
  )
  console.log('')

  console.log('✅ Analysis complete! Use this data to inform template creation.')
  console.log('')
}

// Run the analysis
analyzeGoals()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
