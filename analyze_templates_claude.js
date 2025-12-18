/**
 * Script to analyze question templates using Anthropic Claude 3 Sonnet
 *
 * Usage:
 *   node analyze_templates_claude.js
 *
 * Requires:
 *   - ANTHROPIC_API_KEY environment variable
 *   - question_templates_for_review.json file in same directory
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load the prompt
const promptFile = path.join(__dirname, 'analyze_question_templates_prompt.md')
const prompt = fs.readFileSync(promptFile, 'utf-8')

// Load the templates
const templatesFile = path.join(__dirname, 'question_templates_for_review.json')
const templates = JSON.parse(fs.readFileSync(templatesFile, 'utf-8'))

// Get API key
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set')
  console.error('   Set it with: export ANTHROPIC_API_KEY="your-key-here"')
  process.exit(1)
}

// Build the full prompt with templates
const fullPrompt = prompt.replace(
  '## Template Data to Analyze\n\n[Paste the entire question_templates_for_review.json content here]',
  `## Template Data to Analyze\n\n\`\`\`json\n${JSON.stringify(templates, null, 2)}\n\`\`\``,
)

async function analyzeTemplates() {
  console.log('🔍 Starting template analysis with Claude 3 Sonnet...\n')
  console.log(`📊 Analyzing ${templates.length} question templates\n`)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Latest Claude Sonnet
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const analysis = data.content[0]?.text

    if (!analysis) {
      throw new Error('No analysis returned from Anthropic')
    }

    // Save analysis to file
    const outputFile = path.join(__dirname, 'template_analysis_report.md')
    fs.writeFileSync(outputFile, analysis, 'utf-8')

    console.log('✅ Analysis complete!\n')
    console.log('📄 Full analysis saved to: template_analysis_report.md\n')
    console.log('📋 Preview:\n')
    console.log('─'.repeat(80))
    console.log(analysis.substring(0, 500) + '...')
    console.log('─'.repeat(80))
    console.log('\n💡 Tip: Open template_analysis_report.md to see the full analysis')
  } catch (error) {
    console.error('❌ Error analyzing templates:', error.message)
    if (error.message.includes('API key')) {
      console.error('\n💡 Make sure your ANTHROPIC_API_KEY is set correctly')
    }
    process.exit(1)
  }
}

// Run the analysis
analyzeTemplates()





