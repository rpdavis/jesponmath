/**
 * Script to analyze question templates using OpenAI GPT-4 Turbo
 *
 * Usage:
 *   node analyze_templates_script.js
 *
 * Requires:
 *   - OPENAI_API_KEY environment variable
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
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('❌ Error: OPENAI_API_KEY environment variable not set')
  console.error('   Set it with: export OPENAI_API_KEY="your-key-here"')
  process.exit(1)
}

// Build the full prompt with templates
const fullPrompt = prompt.replace(
  '## Template Data to Analyze\n\n[Paste the entire question_templates_for_review.json content here]',
  `## Template Data to Analyze\n\n\`\`\`json\n${JSON.stringify(templates, null, 2)}\n\`\`\``,
)

async function analyzeTemplates() {
  console.log('🔍 Starting template analysis with GPT-4 Turbo...\n')
  console.log(`📊 Analyzing ${templates.length} question templates\n`)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview', // or 'gpt-4o' if available
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational assessment designer and data analyst specializing in IEP (Individualized Education Program) assessments. You provide detailed, structured analysis of question templates.',
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 4000, // Adjust based on response length needed
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content

    if (!analysis) {
      throw new Error('No analysis returned from OpenAI')
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
      console.error('\n💡 Make sure your OPENAI_API_KEY is set correctly')
    }
    process.exit(1)
  }
}

// Run the analysis
analyzeTemplates()
