<template>
  <div class="goal-template-analyzer">
    <div class="page-header">
      <h1>📊 Goal Template Analyzer</h1>
      <p>Analyze existing goals to identify patterns for the template system</p>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <button @click="runAnalysis" class="btn btn-primary" :disabled="loading">
        {{ loading ? '⏳ Analyzing...' : '🚀 Analyze Goals' }}
      </button>
      <button @click="clearResults" class="btn btn-secondary" :disabled="loading || !hasResults">
        🗑️ Clear Results
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing {{ totalGoals }} goals...</p>
    </div>

    <!-- Results -->
    <div v-if="hasResults && !loading" class="results-section">
      <!-- Basic Statistics -->
      <div class="report-section">
        <h2>📊 Basic Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Goals</div>
            <div class="stat-value">{{ analysis.totalGoals }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Goals</div>
            <div class="stat-value">{{ analysis.activeGoals }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Archived Goals</div>
            <div class="stat-value">{{ analysis.archivedGoals }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Met Goals</div>
            <div class="stat-value">{{ analysis.metGoals }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">With Baseline</div>
            <div class="stat-value">{{ analysis.hasBaseline }} ({{ baselinePercent }}%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">With Standard</div>
            <div class="stat-value">{{ analysis.hasStandard }} ({{ standardPercent }}%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">With Grade Level</div>
            <div class="stat-value">{{ analysis.hasGradeLevel }} ({{ gradeLevelPercent }}%)</div>
          </div>
        </div>
      </div>

      <!-- Subject Breakdown -->
      <div class="report-section">
        <h2>📚 Subject Breakdown</h2>
        <div class="subject-breakdown">
          <div v-for="[subject, count] in sortedSubjects" :key="subject" class="subject-item">
            <div class="subject-label">{{ subject.toUpperCase() }}</div>
            <div class="subject-bar">
              <div
                class="subject-fill"
                :style="{ width: `${(count / analysis.totalGoals) * 100}%` }"
              ></div>
            </div>
            <div class="subject-value">{{ count }} ({{ Math.round((count / analysis.totalGoals) * 100) }}%)</div>
          </div>
        </div>
      </div>

      <!-- Grade Level Distribution -->
      <div class="report-section">
        <h2>🎓 Grade Level Distribution</h2>
        <div class="grade-levels">
          <div v-for="[grade, count] in sortedGrades" :key="grade" class="grade-item">
            <span class="grade-label">Grade {{ grade }}</span>
            <span class="grade-count">{{ count }} ({{ Math.round((count / analysis.totalGoals) * 100) }}%)</span>
          </div>
          <div v-if="sortedGrades.length === 0" class="empty-message">No grade levels specified in goals.</div>
        </div>
      </div>

      <!-- Top Areas of Need -->
      <div class="report-section">
        <h2>🎯 Top Areas of Need (Top 15)</h2>
        <div class="list-items">
          <div v-for="([area, count], index) in sortedAreas" :key="area" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">{{ area }}</span>
            <span class="item-count">{{ count }} ({{ Math.round((count / analysis.totalGoals) * 100) }}%)</span>
          </div>
        </div>
      </div>

      <!-- Top Topics -->
      <div class="report-section">
        <h2>📖 Top Topics Detected (Top 20)</h2>
        <div class="list-items">
          <div v-for="([topic, count], index) in sortedTopics" :key="topic" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">{{ topic }}</span>
            <span class="item-count">{{ count }} ({{ Math.round((count / analysis.totalGoals) * 100) }}%)</span>
          </div>
        </div>
      </div>

      <!-- Top Standards -->
      <div class="report-section">
        <h2>📋 Top Standards (Top 15)</h2>
        <div class="list-items">
          <div v-for="([standard, count], index) in sortedStandards" :key="standard" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">{{ standard }}</span>
            <span class="item-count">{{ count }} ({{ Math.round((count / analysis.totalGoals) * 100) }}%)</span>
          </div>
          <div v-if="sortedStandards.length === 0" class="empty-message">No standards specified in goals.</div>
        </div>
      </div>

      <!-- Threshold Patterns -->
      <div class="report-section">
        <h2>📈 Threshold Patterns</h2>
        <div class="list-items">
          <div v-for="([key, count], index) in sortedThresholds" :key="key" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">{{ key }}</span>
            <span class="item-count">{{ count }} occurrences</span>
          </div>
          <div v-if="sortedThresholds.length === 0" class="empty-message">No threshold patterns detected.</div>
        </div>
      </div>

      <!-- Common Conditions -->
      <div class="report-section">
        <h2>🔧 Common Conditions (Top 15)</h2>
        <div class="list-items">
          <div v-for="([condition, count], index) in sortedConditions" :key="condition" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">"{{ condition }}"</span>
            <span class="item-count">{{ count }} occurrences</span>
          </div>
          <div v-if="sortedConditions.length === 0" class="empty-message">No condition patterns detected.</div>
        </div>
      </div>

      <!-- Common Phrases -->
      <div class="report-section">
        <h2>💬 Common Phrases (Top 20)</h2>
        <div class="list-items">
          <div v-for="([phrase, count], index) in sortedPhrases" :key="phrase" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">"{{ phrase }}"</span>
            <span class="item-count">{{ count }} occurrences</span>
          </div>
        </div>
      </div>

      <!-- Sample Goal Titles -->
      <div class="report-section">
        <h2>📝 Sample Goal Titles (First 10)</h2>
        <div class="list-items">
          <div v-for="(title, index) in sampleTitles" :key="index" class="list-item">
            <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
            <span class="item-label">{{ title }}</span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="report-section recommendations">
        <h2>🎯 Template System Recommendations</h2>

        <div class="recommendation-block">
          <h3>Priority Templates to Create:</h3>
          <div class="list-items">
            <div v-for="([topic, count], index) in topTopics" :key="topic" class="list-item highlight">
              <span class="item-number">{{ (index + 1).toString().padStart(2) }}.</span>
              <span class="item-label">{{ topic.toUpperCase() }}</span>
              <span class="item-count">{{ count }} goals</span>
            </div>
          </div>
        </div>

        <div class="recommendation-block">
          <h3>Template Components to Consider:</h3>
          <ul class="components-list">
            <li><strong>Topic:</strong> Based on detected topics above</li>
            <li><strong>Grade Level:</strong> Most common grades are: {{ commonGrades }}</li>
            <li><strong>Threshold:</strong> Common patterns: {{ commonThresholds }}</li>
            <li><strong>Condition:</strong> Common conditions: {{ commonConditions }}</li>
          </ul>
        </div>
      </div>

      <!-- Math Goals by Topic -->
      <div class="report-section math-goals-section">
        <h2>🔢 Math Goals Organized by Topic</h2>
        <div v-if="mathGoalsByTopic.length === 0" class="empty-message">
          No math goals found.
        </div>
        <div v-else class="math-topics-container">
          <div v-for="[topic, goals] in mathGoalsByTopic" :key="topic" class="topic-group">
            <h3 class="topic-header">
              {{ topic.charAt(0).toUpperCase() + topic.slice(1) }}
              <span class="topic-count">({{ goals.length }} goal{{ goals.length !== 1 ? 's' : '' }})</span>
            </h3>
            <div class="goals-list">
              <div v-for="goal in goals" :key="goal.id" class="goal-item">
                <div class="goal-title">{{ goal.goalTitle || 'Untitled Goal' }}</div>
                <div class="goal-text">{{ goal.goalText || 'No goal text available' }}</div>
                <div class="goal-meta">
                  <span v-if="goal.gradeLevel" class="meta-badge">Grade {{ goal.gradeLevel }}</span>
                  <span v-if="goal.areaOfNeed" class="meta-badge">{{ goal.areaOfNeed }}</span>
                  <span v-if="goal.standard" class="meta-badge">{{ goal.standard }}</span>
                  <span v-if="goal.baseline" class="meta-badge baseline-badge">Baseline: {{ goal.baseline }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ELA Goals by Topic -->
      <div class="report-section ela-goals-section">
        <h2>📚 ELA Goals Organized by Topic</h2>
        <div v-if="elaGoalsByTopic.length === 0" class="empty-message">
          No ELA goals found.
        </div>
        <div v-else class="math-topics-container">
          <div v-for="[topic, goals] in elaGoalsByTopic" :key="topic" class="topic-group">
            <h3 class="topic-header">
              {{ topic.charAt(0).toUpperCase() + topic.slice(1) }}
              <span class="topic-count">({{ goals.length }} goal{{ goals.length !== 1 ? 's' : '' }})</span>
            </h3>
            <div class="goals-list">
              <div v-for="goal in goals" :key="goal.id" class="goal-item">
                <div class="goal-title">{{ goal.goalTitle || 'Untitled Goal' }}</div>
                <div class="goal-text">{{ goal.goalText || 'No goal text available' }}</div>
                <div class="goal-meta">
                  <span v-if="goal.gradeLevel" class="meta-badge">Grade {{ goal.gradeLevel }}</span>
                  <span v-if="goal.areaOfNeed" class="meta-badge">{{ goal.areaOfNeed }}</span>
                  <span v-if="goal.standard" class="meta-badge">{{ goal.standard }}</span>
                  <span v-if="goal.baseline" class="meta-badge baseline-badge">Baseline: {{ goal.baseline }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Goals by Topic -->
      <div class="report-section other-goals-section">
        <h2>📋 Other Goals Organized by Topic</h2>
        <div v-if="otherGoalsByTopic.length === 0" class="empty-message">
          No other goals found.
        </div>
        <div v-else class="math-topics-container">
          <div v-for="[topic, goals] in otherGoalsByTopic" :key="topic" class="topic-group">
            <h3 class="topic-header">
              {{ topic.charAt(0).toUpperCase() + topic.slice(1) }}
              <span class="topic-count">({{ goals.length }} goal{{ goals.length !== 1 ? 's' : '' }})</span>
            </h3>
            <div class="goals-list">
              <div v-for="goal in goals" :key="goal.id" class="goal-item">
                <div class="goal-title">{{ goal.goalTitle || 'Untitled Goal' }}</div>
                <div class="goal-text">{{ goal.goalText || 'No goal text available' }}</div>
                <div class="goal-meta">
                  <span v-if="goal.gradeLevel" class="meta-badge">Grade {{ goal.gradeLevel }}</span>
                  <span v-if="goal.areaOfNeed" class="meta-badge">{{ goal.areaOfNeed }}</span>
                  <span v-if="goal.standard" class="meta-badge">{{ goal.standard }}</span>
                  <span v-if="goal.baseline" class="meta-badge baseline-badge">Baseline: {{ goal.baseline }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !hasResults" class="empty-state">
      <p>Click "Analyze Goals" to analyze all goals in the database and identify patterns for template creation.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllGoals } from '@/firebase/goalServices'
import type { Goal } from '@/types/iep'

// Analysis data structures
interface AnalysisData {
  totalGoals: number
  gradeLevels: Record<number, number>
  areasOfNeed: Record<string, number>
  standards: Record<string, number>
  subjects: { math: number; ela: number; other: number }
  topics: Record<string, number>
  thresholds: Array<{ type: string; value: string | number; text: string }>
  conditions: string[]
  commonPhrases: Record<string, number>
  goalTitles: string[]
  goalTexts: string[]
  hasBaseline: number
  hasStandard: number
  hasGradeLevel: number
  activeGoals: number
  archivedGoals: number
  metGoals: number
  goals: Goal[]
}

const loading = ref(false)
const analysis = ref<AnalysisData>({
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
  goals: [],
})

const totalGoals = ref(0)

// Keywords for topic detection
// Order matters: more specific topics should come first (they'll be checked first)
const mathKeywords: Record<string, string[]> = {
  // Most specific topics first
  'multi-step word problem': ['multi-step word problem', 'multi step word problem', 'multi-step word problems', 'multi step word problems', 'multistep word problem', 'multistep word problems', 'multi step problem', 'multi-step problem', 'multi-step real-world'],
  'two-step word problem': ['two-step word problem', 'two step word problem', 'two-step word problems', 'two step word problems', 'two step problem', 'two-step problem'],
  'multi-step equation': ['multi-step equation', 'multi step equation', 'multi-step equations', 'multi step equations', 'multistep equation', 'multistep equations'],
  'two-step equation': ['two-step equation', 'two step equation', 'two-step equations', 'two step equations'],
  // More general topics
  'word problem': ['word problem', 'word problems', 'story problem', 'story problems', 'real-world', 'real world problem'],
  equation: ['equation', 'equations', 'solve', 'solving', 'one-step equation', 'one step equation'],
  algebra: ['algebra', 'algebraic', 'variable', 'variables', 'expression', 'expressions'],
  fraction: [
    'fraction',
    'fractions',
    'numerator',
    'denominator',
    'improper',
    'mixed number',
    'mixed numbers',
    'multiply a fraction',
    'multiply fraction',
    'multiplying fraction',
    'multiply by a fraction',
    'multiply by fraction',
    'fraction by fraction',
    'fraction problems',
  ],
  decimal: ['decimal', 'decimals', 'decimal point', 'decimal points'],
  percentage: ['percentage', 'percent', 'percents', 'percentages', '%'],
  'rational number': ['rational number', 'rational numbers'],
  'whole number': ['whole number', 'whole numbers', 'integer', 'integers'],
  geometry: ['geometry', 'geometric', 'area', 'perimeter', 'volume', 'angle', 'angles'],
  measurement: ['measure', 'measurement', 'unit', 'units', 'convert', 'conversion'],
  // Operations (least specific - checked last)
  multiplication: ['multiply', 'multiplication', 'multiplying', 'product', 'times'],
  division: ['divide', 'division', 'dividing', 'quotient'],
  addition: ['add', 'addition', 'adding', 'sum', 'plus'],
  subtraction: ['subtract', 'subtraction', 'subtracting', 'difference', 'minus'],
}

// Topic specificity ranking (higher number = more specific, should be prioritized)
const topicSpecificity: Record<string, number> = {
  'multi-step word problem': 10,
  'two-step word problem': 9,
  'multi-step equation': 8,
  'two-step equation': 7,
  'word problem': 6,
  equation: 5,
  algebra: 5,
  fraction: 5,
  decimal: 4,
  percentage: 4,
  'rational number': 4,
  'whole number': 3,
  geometry: 4,
  measurement: 4,
  multiplication: 2,
  division: 2,
  addition: 1,
  subtraction: 1,
}

const elaKeywords: Record<string, string[]> = {
  // Most specific topics first
  'reading comprehension': ['reading comprehension', 'comprehend', 'understand text', 'comprehension'],
  vocabulary: ['vocabulary', 'word meaning', 'define', 'definition'],
  writing: ['writing', 'write', 'compose', 'composition', 'essay'],
  grammar: ['grammar', 'grammatical', 'sentence structure', 'punctuation'],
  phonics: ['phonics', 'phonetic', 'sound', 'sounds', 'decode', 'decoding'],
  reading: ['reading', 'read', 'text', 'passage'],
}

// ELA topic specificity ranking
const elaTopicSpecificity: Record<string, number> = {
  'reading comprehension': 6,
  vocabulary: 5,
  writing: 5,
  grammar: 4,
  phonics: 4,
  reading: 3,
}

// Extract threshold patterns
function extractThresholds(text: string) {
  const thresholds: Array<{ type: string; value: string | number; text: string }> = []
  const lowerText = text.toLowerCase()

  // Percentage patterns
  const percentMatches = lowerText.match(/(\d+)%|(\d+)\s*percent/gi)
  if (percentMatches) {
    percentMatches.forEach((match) => {
      const num = parseInt(match.match(/\d+/)![0])
      thresholds.push({ type: 'percentage', value: num, text: match })
    })
  }

  // "X out of Y" patterns
  const outOfMatches = lowerText.match(/(\d+)\s+out\s+of\s+(\d+)/gi)
  if (outOfMatches) {
    outOfMatches.forEach((match) => {
      const parts = match.match(/(\d+)\s+out\s+of\s+(\d+)/i)!
      thresholds.push({ type: 'outOf', value: `${parts[1]}/${parts[2]}`, text: match })
    })
  }

  // Fraction patterns
  const fractionMatches = lowerText.match(/(\d+)\/(\d+)/g)
  if (fractionMatches) {
    fractionMatches.forEach((match) => {
      thresholds.push({ type: 'fraction', value: match, text: match })
    })
  }

  return thresholds
}

// Extract condition patterns
function extractConditions(text: string): string[] {
  const conditions: string[] = []
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

  return [...new Set(conditions)]
}

// Check if a match is in a threshold/measurement context (should be excluded)
function isInThresholdContext(text: string, matchIndex: number, keyword: string): boolean {
  const contextBefore = text.substring(Math.max(0, matchIndex - 60), matchIndex).toLowerCase()
  const contextAfter = text.substring(matchIndex + keyword.length, matchIndex + keyword.length + 60).toLowerCase()
  const fullContext = contextBefore + ' ' + contextAfter

  // Threshold/measurement phrases that indicate this is not a topic
  const thresholdPhrases = [
    'accuracy',
    'measured by',
    'as measured by',
    'measured',
    'out of',
    'trials',
    'trial',
    'with accuracy',
    'accuracy in',
    'assessment',
    'assessments',
    'work samples',
    'student work',
    'teacher charted',
    'curriculum based',
    'progress monitoring',
    'monitoring assessment',
    'monitoring assessments',
    'will demonstrate',
    'given',
    'when given',
  ]

  // Check if the match appears near threshold language
  return thresholdPhrases.some((phrase) => fullContext.includes(phrase))
}

// Check if percentage/measurement is actually a topic (not threshold language)
function isTopicContext(text: string, matchIndex: number, keyword: string, topic: string): boolean {
  const contextBefore = text.substring(Math.max(0, matchIndex - 40), matchIndex).toLowerCase()
  const contextAfter = text.substring(matchIndex + keyword.length, matchIndex + keyword.length + 40).toLowerCase()

  // Topic indicators that suggest this IS a topic, not threshold language
  const topicIndicators = {
    percentage: ['calculate', 'find', 'solve', 'compute', 'determine', 'convert', 'percentage problem', 'percent of', 'percentages', 'percentage word'],
    measurement: ['measure', 'convert', 'unit', 'length', 'width', 'height', 'distance', 'weight', 'capacity', 'time', 'temperature', 'measurement problem', 'measuring'],
  }

  const indicators = topicIndicators[topic as keyof typeof topicIndicators] || []
  const fullContext = contextBefore + ' ' + contextAfter

  // If it appears near topic indicators, it's likely a topic
  return indicators.some((indicator) => fullContext.includes(indicator))
}

// Extract the "given" clause from goal text (the main topic description)
function extractGivenClause(text: string): string {
  // Look for "given" or "when given" patterns
  // Capture everything after "given" until a comma, period, or "will"/"student"
  const givenPatterns = [
    /(?:when\s+)?given\s+([^,]+?)(?:,\s*(?:the\s+)?(?:student|will)|\.|$)/i,
    /(?:when\s+)?given\s+(.+?)(?:will|the\s+student|student)/i,
    /(?:when\s+)?given\s+([^,]+)/i, // Fallback: just capture until first comma
  ]

  for (const pattern of givenPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      // Clean up the extracted clause
      let clause = match[1].trim()
      // Remove trailing punctuation
      clause = clause.replace(/[.,;:]$/, '')
      return clause.toLowerCase()
    }
  }

  // If no "given" clause found, return empty string
  return ''
}

// Check if "whole number" appears in fraction operation context (should be deprioritized)
function isWholeNumberInFractionContext(text: string, wholeNumberIndex: number): boolean {
  const contextBefore = text.substring(Math.max(0, wholeNumberIndex - 50), wholeNumberIndex).toLowerCase()
  const contextAfter = text.substring(wholeNumberIndex + 'whole number'.length, wholeNumberIndex + 'whole number'.length + 50).toLowerCase()
  const fullContext = contextBefore + ' ' + contextAfter

  // Patterns that indicate whole number is part of a fraction operation
  const fractionOperationPatterns = [
    'multiply',
    'multiplying',
    'multiply a fraction',
    'multiply by a fraction',
    'fraction or whole number',
    'whole number or fraction',
    'fraction by',
    'by a fraction',
    'fraction problems',
    'fraction operation',
  ]

  return fractionOperationPatterns.some((pattern) => fullContext.includes(pattern))
}

// Detect topic from text, excluding threshold/measurement contexts
// Returns topics with priority: topics in "given" clause are prioritized, and more specific topics rank higher
function detectTopic(text: string, keywords: Record<string, string[]>): string[] {
  const lowerText = text.toLowerCase()
  const givenClause = extractGivenClause(text)
  const matches: Array<{ topic: string; priority: number; specificity: number }> = []

  for (const [topic, keys] of Object.entries(keywords)) {
    for (const key of keys) {
      const matchIndex = lowerText.indexOf(key)
      if (matchIndex !== -1) {
        // For percentage and measurement, require topic context AND exclude if threshold context
        if (topic === 'percentage' || topic === 'measurement') {
          // First check if it's in threshold context - if so, exclude it
          if (isInThresholdContext(lowerText, matchIndex, key)) {
            continue // Skip - it's threshold language, not a topic
          }
          // Then check if it's actually a topic
          if (!isTopicContext(lowerText, matchIndex, key, topic)) {
            continue // Skip - no clear topic context
          }
        }

        // For fraction and decimal, exclude if in threshold context
        if (topic === 'fraction' || topic === 'decimal') {
          if (isInThresholdContext(lowerText, matchIndex, key)) {
            continue // Skip this match
          }
        }

        // Special handling: if "whole number" appears in fraction operation context, deprioritize it
        if (topic === 'whole number') {
          if (isWholeNumberInFractionContext(lowerText, matchIndex)) {
            // Check if fraction is also detected - if so, skip whole number
            const hasFraction = lowerText.includes('fraction') || lowerText.includes('fractions')
            if (hasFraction) {
              continue // Skip whole number if fraction operations are present
            }
          }
        }

        // Determine priority: topics in "given" clause get priority 1, others get priority 2
        const isInGivenClause = givenClause && givenClause.includes(key)
        const priority = isInGivenClause ? 1 : 2

        // Get specificity ranking (higher = more specific)
        // Check both math and ELA specificity maps
        const specificity = topicSpecificity[topic] || elaTopicSpecificity[topic] || 0

        matches.push({ topic, priority, specificity })
        break
      }
    }
  }

  // Sort by priority first (lower number = higher priority), then by specificity (higher = more specific)
  matches.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return b.specificity - a.specificity // Higher specificity first
  })

  // Return only the highest priority topics, and among those, only the most specific one(s)
  const highestPriority = matches[0]?.priority || 2
  const topPriorityMatches = matches.filter((m) => m.priority === highestPriority)

  if (topPriorityMatches.length === 0) {
    return []
  }

  // Among top priority matches, get the highest specificity
  const highestSpecificity = topPriorityMatches[0]?.specificity || 0
  const topMatches = topPriorityMatches.filter((m) => m.specificity === highestSpecificity)

  return topMatches.map((m) => m.topic)
}

// Extract common phrases
function extractPhrases(text: string): string[] {
  const phrases = new Set<string>()
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

// Detect subject
function detectSubject(goal: Goal): 'math' | 'ela' | 'other' {
  const text = `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`.toLowerCase()

  // Exclude non-academic goals
  const excludeIndicators = [
    'letter distribution',
    'email',
    'social emotional',
    'behavior',
    'attendance',
    'organization',
  ]

  if (excludeIndicators.some((ind) => text.includes(ind))) {
    return 'other'
  }

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
    'word problem',
    'calculation',
    'fluency',
    'expression',
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
  if (hasMath && hasEla) return 'other'
  return 'other'
}

async function runAnalysis() {
  loading.value = true
  try {
    // Reset analysis
    analysis.value = {
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
      goals: [],
    }

    // Get all goals
    const goals = await getAllGoals()
    totalGoals.value = goals.length
    analysis.value.totalGoals = goals.length
    analysis.value.goals = goals

    if (goals.length === 0) {
      alert('No goals found in database.')
      return
    }

    // Analyze each goal
    goals.forEach((goal) => {
      // Basic stats
      if (goal.isActive && !goal.isArchived && !goal.isMet) analysis.value.activeGoals++
      if (goal.isArchived) analysis.value.archivedGoals++
      if (goal.isMet) analysis.value.metGoals++
      if (goal.baseline) analysis.value.hasBaseline++
      if (goal.standard) analysis.value.hasStandard++
      if (goal.gradeLevel) analysis.value.hasGradeLevel++

      // Grade levels
      if (goal.gradeLevel) {
        analysis.value.gradeLevels[goal.gradeLevel] =
          (analysis.value.gradeLevels[goal.gradeLevel] || 0) + 1
      }

      // Areas of need
      if (goal.areaOfNeed) {
        analysis.value.areasOfNeed[goal.areaOfNeed] =
          (analysis.value.areasOfNeed[goal.areaOfNeed] || 0) + 1
      }

      // Standards
      if (goal.standard) {
        analysis.value.standards[goal.standard] = (analysis.value.standards[goal.standard] || 0) + 1
      }

      // Subject detection
      const subject = detectSubject(goal)
      analysis.value.subjects[subject]++

      // Topic detection (use original text for "given" clause extraction)
      const combinedText = `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`
      const mathTopics = detectTopic(combinedText, mathKeywords)
      const elaTopics = detectTopic(combinedText, elaKeywords)

      // Only count the primary topic (first/highest priority) for statistics
      if (mathTopics.length > 0) {
        const primaryTopic = mathTopics[0]
        analysis.value.topics[primaryTopic] = (analysis.value.topics[primaryTopic] || 0) + 1
      }

      if (elaTopics.length > 0) {
        const primaryTopic = elaTopics[0]
        analysis.value.topics[primaryTopic] = (analysis.value.topics[primaryTopic] || 0) + 1
      }

      // Extract thresholds
      const thresholds = extractThresholds(goal.goalText || '')
      analysis.value.thresholds.push(...thresholds)

      // Extract conditions
      const conditions = extractConditions(goal.goalText || '')
      analysis.value.conditions.push(...conditions)

      // Extract phrases
      const phrases = extractPhrases(goal.goalText || '')
      phrases.forEach((phrase) => {
        analysis.value.commonPhrases[phrase] = (analysis.value.commonPhrases[phrase] || 0) + 1
      })

      // Store titles and texts
      if (goal.goalTitle) analysis.value.goalTitles.push(goal.goalTitle)
      if (goal.goalText) analysis.value.goalTexts.push(goal.goalText)
    })
  } catch (error) {
    console.error('Error analyzing goals:', error)
    alert('Error analyzing goals. Please check the console.')
  } finally {
    loading.value = false
  }
}

function clearResults() {
  analysis.value = {
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
    goals: [],
  }
  totalGoals.value = 0
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Computed properties
const hasResults = computed(() => analysis.value.totalGoals > 0)

const baselinePercent = computed(() =>
  analysis.value.totalGoals > 0
    ? Math.round((analysis.value.hasBaseline / analysis.value.totalGoals) * 100)
    : 0,
)

const standardPercent = computed(() =>
  analysis.value.totalGoals > 0
    ? Math.round((analysis.value.hasStandard / analysis.value.totalGoals) * 100)
    : 0,
)

const gradeLevelPercent = computed(() =>
  analysis.value.totalGoals > 0
    ? Math.round((analysis.value.hasGradeLevel / analysis.value.totalGoals) * 100)
    : 0,
)

const sortedSubjects = computed(() =>
  Object.entries(analysis.value.subjects).sort((a, b) => b[1] - a[1]),
)

const sortedGrades = computed(() =>
  Object.entries(analysis.value.gradeLevels).sort((a, b) => parseInt(a[0]) - parseInt(b[0])),
)

const sortedAreas = computed(() =>
  Object.entries(analysis.value.areasOfNeed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15),
)

const sortedTopics = computed(() =>
  Object.entries(analysis.value.topics).sort((a, b) => b[1] - a[1]).slice(0, 20),
)

const sortedStandards = computed(() =>
  Object.entries(analysis.value.standards).sort((a, b) => b[1] - a[1]).slice(0, 15),
)

const sortedThresholds = computed(() => {
  const thresholdCounts: Record<string, number> = {}
  analysis.value.thresholds.forEach((t) => {
    const key = `${t.type}:${t.value}`
    thresholdCounts[key] = (thresholdCounts[key] || 0) + 1
  })
  return Object.entries(thresholdCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
})

const sortedConditions = computed(() => {
  const conditionCounts: Record<string, number> = {}
  analysis.value.conditions.forEach((c) => {
    conditionCounts[c] = (conditionCounts[c] || 0) + 1
  })
  return Object.entries(conditionCounts).sort((a, b) => b[1] - a[1]).slice(0, 15)
})

const sortedPhrases = computed(() =>
  Object.entries(analysis.value.commonPhrases)
    .filter(([phrase, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20),
)

const sampleTitles = computed(() => analysis.value.goalTitles.slice(0, 10))

const topTopics = computed(() => sortedTopics.value.slice(0, 10))

const commonGrades = computed(() =>
  sortedGrades.value
    .slice(0, 3)
    .map(([g]) => `Grade ${g}`)
    .join(', ') || 'None',
)

const commonThresholds = computed(() =>
  sortedThresholds.value
    .slice(0, 3)
    .map(([t]) => t.split(':')[1])
    .join(', ') || 'None',
)

const commonConditions = computed(() =>
  sortedConditions.value
    .slice(0, 3)
    .map(([c]) => `"${c}"`)
    .join(', ') || 'None',
)

// Group math goals by topic
const mathGoalsByTopic = computed(() => {
  if (!analysis.value.goals || analysis.value.goals.length === 0) {
    return []
  }

  // Filter to only math goals
  const mathGoals = analysis.value.goals.filter((goal) => {
    const subject = detectSubject(goal)
    if (subject !== 'math') {
      return false
    }

    // Double-check: ensure the goal has math-related content
    const combinedText = `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`.toLowerCase()
    const hasMathContent =
      combinedText.includes('math') ||
      combinedText.includes('mathematics') ||
      combinedText.includes('equation') ||
      combinedText.includes('number') ||
      combinedText.includes('calculation') ||
      combinedText.includes('problem') ||
      combinedText.includes('add') ||
      combinedText.includes('subtract') ||
      combinedText.includes('multiply') ||
      combinedText.includes('divide')

    return hasMathContent
  })

  // Group by topic
  const goalsByTopic: Record<string, Goal[]> = {}

  mathGoals.forEach((goal) => {
    const combinedText = `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`
    const topics = detectTopic(combinedText, mathKeywords)

    if (topics.length === 0) {
      // If no topic detected, put in "other" category
      if (!goalsByTopic['other']) {
        goalsByTopic['other'] = []
      }
      goalsByTopic['other'].push(goal)
    } else {
      // Only add goal to the PRIMARY topic (first/highest priority topic)
      // This prevents goals from appearing in multiple categories
      const primaryTopic = topics[0]
      if (!goalsByTopic[primaryTopic]) {
        goalsByTopic[primaryTopic] = []
      }
      goalsByTopic[primaryTopic].push(goal)
    }
  })

  // Convert to array and sort by topic name
  return Object.entries(goalsByTopic).sort((a, b) => a[0].localeCompare(b[0]))
})

// Group ELA goals by topic
const elaGoalsByTopic = computed(() => {
  if (!analysis.value.goals || analysis.value.goals.length === 0) {
    return []
  }

  // Filter to only ELA goals
  const elaGoals = analysis.value.goals.filter((goal) => {
    const subject = detectSubject(goal)
    return subject === 'ela'
  })

  // Group by topic
  const goalsByTopic: Record<string, Goal[]> = {}

  elaGoals.forEach((goal) => {
    const combinedText = `${goal.goalTitle} ${goal.goalText} ${goal.areaOfNeed || ''}`
    const topics = detectTopic(combinedText, elaKeywords)

    if (topics.length === 0) {
      // If no topic detected, put in "other" category
      if (!goalsByTopic['other']) {
        goalsByTopic['other'] = []
      }
      goalsByTopic['other'].push(goal)
    } else {
      // Only add goal to the PRIMARY topic (first/highest priority topic)
      const primaryTopic = topics[0]
      if (!goalsByTopic[primaryTopic]) {
        goalsByTopic[primaryTopic] = []
      }
      goalsByTopic[primaryTopic].push(goal)
    }
  })

  // Convert to array and sort by topic name
  return Object.entries(goalsByTopic).sort((a, b) => a[0].localeCompare(b[0]))
})

// Group other goals by area of need or topic
const otherGoalsByTopic = computed(() => {
  if (!analysis.value.goals || analysis.value.goals.length === 0) {
    return []
  }

  // Filter to only "other" goals
  const otherGoals = analysis.value.goals.filter((goal) => {
    const subject = detectSubject(goal)
    return subject === 'other'
  })

  // Group by area of need (since these don't have clear topics)
  const goalsByTopic: Record<string, Goal[]> = {}

  otherGoals.forEach((goal) => {
    // Use area of need as the category, or "other" if not available
    const category = goal.areaOfNeed || 'other'
    if (!goalsByTopic[category]) {
      goalsByTopic[category] = []
    }
    goalsByTopic[category].push(goal)
  })

  // Convert to array and sort by category name
  return Object.entries(goalsByTopic).sort((a, b) => a[0].localeCompare(b[0]))
})
</script>

<style scoped>
.goal-template-analyzer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.controls-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.report-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
}

.report-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #333;
}

.report-section.recommendations {
  background: #f8f9fa;
  border-color: #007bff;
}

.recommendation-block {
  margin-top: 1rem;
}

.recommendation-block h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #007bff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.subject-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subject-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.subject-label {
  min-width: 80px;
  font-weight: bold;
}

.subject-bar {
  flex: 1;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.subject-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s;
}

.subject-value {
  min-width: 100px;
  text-align: right;
  font-size: 0.9rem;
}

.grade-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.grade-item {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  display: flex;
  gap: 0.5rem;
}

.grade-label {
  font-weight: bold;
}

.grade-count {
  color: #666;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 4px;
}

.list-item:hover {
  background: #f8f9fa;
}

.list-item.highlight {
  background: #fff3cd;
  font-weight: 500;
}

.item-number {
  min-width: 30px;
  color: #666;
  font-family: monospace;
}

.item-label {
  flex: 1;
}

.item-count {
  color: #666;
  font-size: 0.9rem;
}

.empty-message {
  color: #999;
  font-style: italic;
  padding: 1rem;
}

.components-list {
  list-style: none;
  padding: 0;
}

.components-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.components-list li:last-child {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

/* Goals by Topic Sections */
.math-goals-section,
.ela-goals-section,
.other-goals-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.math-topics-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.topic-group {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
}

.topic-header {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topic-count {
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-item {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border-left: 3px solid #007bff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.goal-title {
  font-weight: 600;
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.goal-text {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.goal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-badge {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.meta-badge.baseline-badge {
  background: #d1ecf1;
  color: #0c5460;
  max-width: 100%;
  word-wrap: break-word;
}
</style>









