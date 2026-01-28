/**
 * AI Question Generator Service
 *
 * This service uses AI (OpenAI, Anthropic, or Google Gemini) to generate
 * assessment questions based on IEP goals.
 *
 * Features:
 * - Context-aware question generation
 * - Fallback to templates if AI fails
 * - Caching to reduce API calls
 * - Cost tracking
 */

import type { Goal, GoalTemplate } from '@/types/iep'
import { getAIModel } from '@/config/aiModels'

export interface QuestionResult {
  question: string
  answer: string
  answerPrefix?: string // Prefix like "x=" or "$"
  answerSuffix?: string // Suffix like " hours" or " dollars"
  alternativeAnswers?: string[] // Alternative acceptable answers for short-answer questions
  explanation?: string
  requiresPhoto?: boolean
  source?: 'template' | 'ai' | 'ai-with-template-reference' | 'fallback' // Track generation source
  aiError?: string // AI error message if generation failed
}

export interface AIGeneratorConfig {
  provider: 'openai' | 'anthropic' | 'google'
  apiKey: string
  model?: string
  temperature?: number
  maxTokens?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

// Default configuration
const DEFAULT_CONFIG: Partial<AIGeneratorConfig> = {
  provider: 'google',
  model: getAIModel('AI_QUESTIONS'), // Current stable model from central config
  temperature: 0.5, // Lower temperature for better Math & JSON stability
  maxTokens: 1500, // Increased to prevent response cut-offs
}

// Default Gemini model (updated to current API)
// Use gemini-2.0-flash for fast generation (latest)
// Use gemini-1.5-pro for better quality
// Use gemini-flash-latest for stable, auto-updating model

/**
 * Generate a question using AI based on the goal
 */
export async function generateQuestionWithAI(
  goal: Goal,
  subject: 'math' | 'ela' | 'other',
  questionNumber: number,
  config?: Partial<AIGeneratorConfig>,
  templateReference?: QuestionResult,
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  customVariationInstructions?: string,
  templateStructure?: GoalTemplate, // NEW: Full template with problemStructure
  previousQuestions?: QuestionResult[], // NEW: Previously generated questions to avoid
  questionCategory?: 'computation' | 'word-problem' | 'conceptual' | 'application', // NEW: Question type
): Promise<QuestionResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config } as AIGeneratorConfig

  // Get API key from config (already set by caller) or environment
  let apiKey = finalConfig.apiKey
  if (!apiKey) {
    apiKey =
      finalConfig.provider === 'google'
        ? import.meta.env.VITE_GEMINI_API_KEY
        : import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error(
        `API key not configured for ${finalConfig.provider}. Set VITE_${finalConfig.provider === 'google' ? 'GEMINI' : 'OPENAI'}_API_KEY environment variable.`,
      )
    }
  }

  // Note: Each provider function (generateWithOpenAI, generateWithAnthropic, generateWithGoogle)
  // builds its own prompt. The templateStructure is passed through to buildPrompt in each function.
  // However, currently only generateWithGoogle path supports templateStructure via the updated
  // generateQuestionWithAI signature. Other providers will need updates to support it.

  try {
    switch (finalConfig.provider) {
      case 'openai':
        return await generateWithOpenAI(
          goal,
          subject,
          questionNumber,
          apiKey,
          finalConfig,
          templateReference,
          allowedOperations,
          customVariationInstructions,
          questionCategory,
        )
      case 'anthropic':
        return await generateWithAnthropic(
          goal,
          subject,
          questionNumber,
          apiKey,
          finalConfig,
          templateReference,
          allowedOperations,
          customVariationInstructions,
          questionCategory,
        )
      case 'google':
        return await generateWithGoogle(
          goal,
          subject,
          questionNumber,
          apiKey,
          finalConfig,
          templateReference,
          allowedOperations,
          customVariationInstructions,
          templateStructure,
          previousQuestions, // Pass previous questions to avoid duplicates
          questionCategory, // Pass question category
        )
      default:
        throw new Error(`Unsupported AI provider: ${finalConfig.provider}`)
    }
  } catch (error) {
    console.error('AI question generation failed:', error)
    throw error
  }
}

/**
 * Generate question using OpenAI API
 */
async function generateWithOpenAI(
  goal: Goal,
  subject: 'math' | 'ela' | 'other',
  questionNumber: number,
  apiKey: string,
  config: AIGeneratorConfig,
  templateReference?: QuestionResult,
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  customVariationInstructions?: string,
  questionCategory?: 'computation' | 'word-problem' | 'conceptual' | 'application',
): Promise<QuestionResult> {
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    config.difficulty || 'medium',
    allowedOperations,
    customVariationInstructions,
    undefined, // templateStructure not passed in this path
    undefined, // previousQuestions not passed in this path
    questionCategory, // Pass question category
  )

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educational assessment question generator. Generate questions that are appropriate for students with IEP goals. You MUST return ONLY valid JSON. Do NOT include any introductory text, markdown code blocks, or conversational filler. Your entire response must be parseable by JSON.parse().',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 500,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content returned from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    return {
      question: cleanQuestionText(parsed.question || 'Error generating question'),
      answer: (parsed.answer || 'N/A').trim(),
      answerPrefix: parsed.answerPrefix || '',
      answerSuffix: parsed.answerSuffix || '',
      alternativeAnswers: parsed.alternativeAnswers || parseAlternativesFromAnswer(parsed.answer),
      explanation: parsed.explanation
        ? parsed.explanation.trim().replace(/^\n+/, '').replace(/\n+$/, '')
        : undefined,
      requiresPhoto: parsed.requiresPhoto !== false, // Default to true for math
      source: 'ai',
    }
  } catch (parseError) {
    console.error('❌ OpenAI JSON parsing failed:', parseError)
    // Fallback: try to extract question and answer from text
    const result = parseTextResponse(content)
    return {
      ...result,
      alternativeAnswers: parseAlternativesFromAnswer(result.answer),
      source: 'ai',
    }
  }
}

/**
 * Generate question using Anthropic API (Claude)
 */
async function generateWithAnthropic(
  goal: Goal,
  subject: 'math' | 'ela' | 'other',
  questionNumber: number,
  apiKey: string,
  config: AIGeneratorConfig,
  templateReference?: QuestionResult,
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  customVariationInstructions?: string,
  questionCategory?: 'computation' | 'word-problem' | 'conceptual' | 'application',
): Promise<QuestionResult> {
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    config.difficulty || 'medium',
    allowedOperations,
    customVariationInstructions,
    undefined, // templateStructure not passed in this path
    undefined, // previousQuestions not passed in this path
    questionCategory, // Pass question category
  )

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-haiku-20240307', // Fast and cheap
      max_tokens: config.maxTokens || 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]?.text

  if (!content) {
    throw new Error('No content returned from Anthropic')
  }

  try {
    const parsed = JSON.parse(content)
    return {
      question: cleanQuestionText(parsed.question || 'Error generating question'),
      answer: (parsed.answer || 'N/A').trim(),
      alternativeAnswers: parsed.alternativeAnswers || parseAlternativesFromAnswer(parsed.answer),
      explanation: parsed.explanation
        ? parsed.explanation.trim().replace(/^\n+/, '').replace(/\n+$/, '')
        : undefined,
      requiresPhoto: parsed.requiresPhoto !== false,
      source: 'ai',
    }
  } catch (parseError) {
    console.error('❌ Anthropic JSON parsing failed:', parseError)
    const result = parseTextResponse(content)
    return {
      ...result,
      alternativeAnswers: parseAlternativesFromAnswer(result.answer),
      source: 'ai',
    }
  }
}

/**
 * Generate question using Google Gemini API via Firebase Function (to avoid CORS)
 */
async function generateWithGoogle(
  goal: Goal,
  subject: 'math' | 'ela' | 'other',
  questionNumber: number,
  apiKey: string,
  config: AIGeneratorConfig,
  templateReference?: QuestionResult,
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  customVariationInstructions?: string,
  templateStructure?: GoalTemplate,
  previousQuestions?: QuestionResult[],
  questionCategory?: 'computation' | 'word-problem' | 'conceptual' | 'application',
): Promise<QuestionResult> {
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    config.difficulty || 'medium',
    allowedOperations,
    customVariationInstructions,
    templateStructure, // Pass template structure for variety instructions
    previousQuestions, // Pass previous questions to avoid duplicates
    questionCategory, // Pass question category
  )

  // Try different models in order of preference
  const modelAttempts = [
    'gemini-2.0-flash', // Primary: Best for JSON & Math reasoning
    'gemini-2.0-flash-lite', // Fallback: Ultra-fast
    'gemini-1.5-flash', // Safety Fallback
  ]

  let lastError: Error | null = null
  let content: string | null = null

  // Use Firebase Function to avoid CORS issues
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const { app } = await import('@/firebase/config')
    const functions = getFunctions(app, 'us-west1')
    const generateWithGemini = httpsCallable(functions, 'generateWithGemini')

    for (const model of modelAttempts) {
      try {
        const result = await generateWithGemini({
          model,
          prompt,
          temperature: config.temperature || 0.5, // Lower for stability
          maxTokens: config.maxTokens || 2000, // Increased to prevent cut-offs
          apiKey,
        })

        const data = result.data as { success: boolean; content?: string; error?: string }
        if (data.success && data.content) {
          content = data.content
          break // Success!
        } else {
          lastError = new Error(`Model ${model} failed: ${data.error || 'No content returned'}`)
        }
      } catch (e: unknown) {
        const error = e as Error
        lastError = new Error(`Model ${model} error: ${error.message || 'Unknown error'}`)
      }
    }
  } catch (e: unknown) {
    const error = e as Error
    // If Firebase Functions fail, throw error
    throw new Error(`Firebase Functions error: ${error.message}`)
  }

  if (!content) {
    throw lastError || new Error('Failed to generate with Google API')
  }

  // Log the raw content for debugging
  console.log('📄 Raw AI response (first 500 chars):', content.substring(0, 500))
  console.log('📄 Raw AI response length:', content.length)

  try {
    // 1. EXTRACT JSON: Use regex to find the JSON object within the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    let cleanJson = jsonMatch ? jsonMatch[0] : content

    console.log('🔍 JSON extraction result:', jsonMatch ? 'Found JSON' : 'No JSON found')
    console.log('🔍 Clean JSON (first 300 chars):', cleanJson.substring(0, 300))

    // 2. EMERGENCY REPAIR: Fix "Unterminated string" by closing quotes and braces
    // This solves the "How much more money does she..." cutoff error
    const quoteCount = (cleanJson.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) {
      console.log('🔧 Repairing unterminated string (odd quote count)')
      cleanJson += '"}' // Close the open string and the object
    } else if (!cleanJson.trim().endsWith('}')) {
      console.log('🔧 Repairing unclosed object')
      cleanJson += '}' // Close just the object
    }

    const parsed = JSON.parse(cleanJson)
    console.log('✅ JSON parsed successfully:', {
      hasQuestion: !!parsed.question,
      hasAnswer: !!parsed.answer,
      questionLength: parsed.question?.length,
      answerValue: parsed.answer,
    })

    return {
      question: cleanQuestionText(parsed.question || 'Error generating question'),
      answer: (parsed.answer || 'N/A').trim(),
      alternativeAnswers: parsed.alternativeAnswers || parseAlternativesFromAnswer(parsed.answer),
      explanation: parsed.explanation
        ? parsed.explanation.trim().replace(/^\n+/, '').replace(/\n+$/, '')
        : undefined,
      requiresPhoto: parsed.requiresPhoto !== false,
      source: 'ai',
    }
  } catch (parseError) {
    console.error('❌ Gemini JSON repair failed:', parseError)
    console.error('❌ Content that failed to parse:', content.substring(0, 500))
    const result = parseTextResponse(content)
    console.warn('⚠️ Falling back to text parsing. Result:', result)
    return {
      ...result,
      alternativeAnswers: parseAlternativesFromAnswer(result.answer),
      source: 'ai',
    }
  }
}

/**
 * Helper function to extract alternatives from answer if not provided
 * Only includes CORRECT alternative formats, not incorrect variations
 */
function parseAlternativesFromAnswer(answer: string): string[] {
  if (!answer) return []

  const alternatives: string[] = [answer.trim()]

  // If answer is a number, add common CORRECT variations
  const numMatch = answer.match(/(-?\d+\.?\d*)/)
  if (numMatch) {
    const num = numMatch[1]
    const numValue = parseFloat(num)

    // Add decimal variations (always correct)
    alternatives.push(num) // "6"
    alternatives.push(`${num}.0`) // "6.0"
    if (!num.includes('.')) {
      alternatives.push(`${num}.00`) // "6.00"
    }

    // Only add positive prefix if the number is positive
    if (numValue > 0) {
      alternatives.push(`+${num}`) // "+6" (only for positive numbers)
    }

    // Add variable format if answer doesn't already have it
    if (!answer.includes('=')) {
      alternatives.push(`x=${num}`) // "x=6"
      alternatives.push(`X=${num}`) // "X=6" (capital)
    }

    // If answer contains "x=" or variable, add just the value
    if (answer.includes('=')) {
      const parts = answer.split('=')
      if (parts.length === 2) {
        const value = parts[1].trim()
        alternatives.push(value) // Just the value
      }
    }
  }

  // Remove duplicates and return
  return [...new Set(alternatives)]
}

/**
 * Build the prompt for AI generation
 */
function buildPrompt(
  goal: Goal,
  subject: 'math' | 'ela' | 'other',
  questionNumber: number,
  templateReference?: QuestionResult,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[],
  customVariationInstructions?: string,
  templateStructure?: GoalTemplate, // NEW: Pass the full template with problemStructure
  previousQuestions?: QuestionResult[], // NEW: Previously generated questions to avoid
  questionCategory?: 'computation' | 'word-problem' | 'conceptual' | 'application', // NEW: Question type
): string {
  // Name variety for each question
  const names = [
    ['Rose', 'Maria', 'Jesus', 'Aisha', 'Jaime'],
    ['Antoinette', 'Jamal', 'Israel', 'Victor', 'Diego'],
    ['Lexee', 'Fatima', 'Jose', 'Daniel', 'Michael'],
    ['Alonzo', 'Omar', 'Mikah', 'Olivia', 'Marcos'],
    ['Dylan', 'Amara', 'Hassan', 'Maya', 'Tucker'],
  ]
  const studentName = names[questionNumber - 1]?.[Math.floor(Math.random() * 5)] || 'Student'

  // Different number range suggestions for each question to force variety
  const numberRangeSuggestions = [
    'Use numbers between 5-15 (small range)',
    'Use numbers between 20-40 (medium range)',
    'Use numbers between 50-100 (larger range)',
    'Use numbers between 2-8 (very small range)',
    'Use numbers between 15-30 (medium-small range)',
  ]
  const suggestedNumberRange =
    numberRangeSuggestions[questionNumber - 1] || 'Vary the numbers significantly'

  // Different scenario types for each question to force variety
  const scenarioSuggestions = [
    'shopping/buying items',
    'cooking/baking recipes',
    'sports/games statistics',
    'school/classroom activities',
    'arts/crafts projects',
  ]
  // For question 2+, AVOID the previous scenarios
  const extractedScenarios: (string | null)[] =
    previousQuestions && previousQuestions.length > 0
      ? previousQuestions.map((pq) => {
          // Extract likely scenario from question
          const q = pq.question.toLowerCase()
          if (q.includes('bak') || q.includes('cook') || q.includes('recip'))
            return 'cooking/baking'
          if (q.includes('buy') || q.includes('shop') || q.includes('store')) return 'shopping'
          if (q.includes('game') || q.includes('sport') || q.includes('play')) return 'sports'
          if (q.includes('school') || q.includes('class') || q.includes('student')) return 'school'
          if (q.includes('art') || q.includes('craft') || q.includes('draw')) return 'arts/crafts'
          return null
        })
      : []
  const avoidScenarios: string[] = extractedScenarios.filter((s): s is string => s !== null)

  // Build variety instructions from template's problemStructure
  let varietyInstructions = `
⚠️ THIS IS QUESTION #${questionNumber} - Use student name: ${studentName}

🚨🚨🚨 CRITICAL VARIETY REQUIREMENTS FOR QUESTION #${questionNumber} 🚨🚨🚨

⚠️ YOU MUST CREATE A COMPLETELY DIFFERENT QUESTION FROM ANY PREVIOUS QUESTIONS:

1. **DIFFERENT ANSWER (MOST IMPORTANT!)**:
   - The final answer MUST be different from previous questions
   - ${previousQuestions && previousQuestions.length > 0 ? `Previous answers: ${previousQuestions.map((pq) => pq.answer).join(', ')} - DO NOT USE THESE!` : 'Ensure variety in final answers'}
   - Calculate your numbers to ensure a UNIQUE answer
   - DO NOT generate questions that result in the same answer

2. **DIFFERENT SCENARIO/CONTEXT**:
   - ${avoidScenarios.length > 0 ? `⚠️ DO NOT use these scenarios (already used): ${avoidScenarios.join(', ')}` : 'Use a unique real-world scenario'}
   - Use a completely different real-world scenario
   - Change the activity, situation, or context dramatically
   - Examples of different scenarios: ${scenarioSuggestions.filter((s) => !avoidScenarios.some((avoid) => s.toLowerCase().includes(avoid.toLowerCase()))).join(', ')}
   - DO NOT repeat similar scenarios

3. **DIFFERENT NUMBERS**:
   - ${suggestedNumberRange}
   - ${previousQuestions && previousQuestions.length > 0 ? 'Avoid using numbers that appear in the previous questions shown above' : 'Use significantly different numbers'}
   - Use significantly different numbers (not just slightly different)
   - Vary number ranges dramatically
   - Use different number patterns (avoid similar calculations)
   - Ensure numbers lead to a DIFFERENT final answer

4. **DIFFERENT ITEMS/OBJECTS**:
   - Change the items, objects, or subjects in the problem
   - If previous mentioned "skateboard", use "bike", "book", "game", "headphones", etc.
   - Vary the context items completely

5. **DIFFERENT STUDENT NAME**:
   - Use the name provided: ${studentName}
   - DO NOT reuse names from previous questions
`

  // Add previous questions section if they exist
  let previousQuestionsSection = ''
  if (previousQuestions && previousQuestions.length > 0) {
    console.log(`🔍 Building prompt with ${previousQuestions.length} previous questions to avoid:`)
    previousQuestions.forEach((pq, idx) => {
      console.log(`   Q${idx + 1}: "${pq.question.substring(0, 80)}..." Answer: ${pq.answer}`)
    })

    previousQuestionsSection = `

🚫🚫🚫 PREVIOUSLY GENERATED QUESTIONS - DO NOT REPEAT THESE 🚫🚫🚫

The following questions have ALREADY been generated. Your new question MUST be completely different from ALL of these:

${previousQuestions
  .map(
    (pq, idx) => `
Question #${idx + 1}:
"${pq.question.substring(0, 200)}${pq.question.length > 200 ? '...' : ''}"
Answer: ${pq.answer}
${pq.answerPrefix ? `Answer Prefix: ${pq.answerPrefix}` : ''}
${pq.answerSuffix ? `Answer Suffix: ${pq.answerSuffix}` : ''}
`,
  )
  .join('\n---\n')}

⚠️ CRITICAL: Your new question MUST:
- Have a DIFFERENT answer (${previousQuestions.length > 0 ? `The previous answers were: ${previousQuestions.map((pq) => pq.answer).join(', ')}. DO NOT use any of these answers!` : 'ensure each answer is unique'})
- Use a COMPLETELY DIFFERENT scenario/context (${previousQuestions.length > 0 ? 'Look at the scenarios above - your scenario must be about something completely different' : 'vary the real-world context'})
- Use SIGNIFICANTLY DIFFERENT numbers (${previousQuestions.length > 0 ? 'Use different number ranges and calculations that produce a different result' : 'ensure variety in calculations'})
- Be about DIFFERENT items/objects/subjects (${previousQuestions.length > 0 ? 'Change the main subject matter entirely' : 'vary what the problem is about'})
- Feel like a completely different problem, not just a minor variation

${previousQuestions.length > 0 ? '⚠️⚠️⚠️ CRITICAL: DO NOT create questions similar to the ones shown above! They are provided so you can AVOID repeating those patterns, scenarios, numbers, and answers.' : ''}
`
  } else {
    console.log(`ℹ️ No previous questions provided (questionNumber: ${questionNumber})`)
  }

  // If template has problemStructure, use it!
  if (templateStructure?.problemStructure) {
    const ps = templateStructure.problemStructure

    // 1. Use specific number ranges for this question
    const questionKey = `question${questionNumber}` as keyof typeof ps.numberRanges
    if (ps.numberRanges?.[questionKey]) {
      varietyInstructions += `
📊 NUMBER REQUIREMENTS FOR QUESTION #${questionNumber}:
${ps.numberRanges[questionKey]}
`
    }

    // 2. Pick a random context from contextTypes
    if (ps.contextTypes && ps.contextTypes.length > 0) {
      const randomContext = ps.contextTypes[Math.floor(Math.random() * ps.contextTypes.length)]
      varietyInstructions += `
🎯 USE THIS CONTEXT: ${randomContext}
`
    }

    // 3. List forbidden patterns
    if (ps.forbiddenPatterns && ps.forbiddenPatterns.length > 0) {
      varietyInstructions += `
⛔ FORBIDDEN PATTERNS (DO NOT USE):
${ps.forbiddenPatterns.map((p: string) => `- DO NOT use "${p}"`).join('\n')}
`
    }
  } else {
    // Fallback: generic variety instructions
    varietyInstructions += `
📊 ADDITIONAL VARIETY REQUIREMENTS:
- Vary the numbers significantly from any template or previous questions
- Change the context/scenario completely
- Use different items, activities, or situations
- Ensure the final answer is UNIQUE and different
`
  }

  // Use custom AI prompt if provided
  if (customVariationInstructions) {
    varietyInstructions += `
📋 CUSTOM VARIATION INSTRUCTIONS:
${customVariationInstructions}
`
  }

  // Add operation constraints if specified
  const operationConstraints =
    allowedOperations && allowedOperations.length > 0
      ? `

🔒 OPERATION CONSTRAINTS (CRITICAL):
- You MUST use ONLY these operations: ${allowedOperations.join(', ')}
- Do NOT use any other operations (${['addition', 'subtraction', 'multiplication', 'division'].filter((op) => !allowedOperations.includes(op as 'addition' | 'subtraction' | 'multiplication' | 'division')).join(', ')})
- This is a strict requirement - questions using unauthorized operations will be rejected
- Example: If only "addition and subtraction" are allowed, do NOT create problems requiring multiplication or division`
      : ''

  const templateSection = templateReference
    ? `

🎯 CRITICAL: TEMPLATE REFERENCE - YOU MUST FOLLOW THIS EXACT STRUCTURE:

TEMPLATE EXAMPLE:
Question: ${templateReference.question}
Answer: ${templateReference.answer}
${templateReference.explanation ? `Explanation: ${templateReference.explanation}` : ''}

📋 PROBLEM TYPE ANALYSIS:
Carefully analyze the template above to identify:
- What TYPE of math problem is this? (e.g., percentage calculation, fraction addition, elapsed time, money word problem, etc.)
- What is the QUESTION ASKING FOR? (e.g., "What percent?", "How much money?", "What time?", "What is X?")
- What is the MATHEMATICAL STRUCTURE? (e.g., "X out of Y total, find percent", "Start time + duration", "Cost - savings")
- What is the ANSWER FORMAT? (e.g., percentage like "90%", money like "$24", time like "3:45 PM", number like "42")

⚠️ STRICT REQUIREMENTS FOR VARIATION:

1. PRESERVE THE EXACT PROBLEM TYPE:
   - If the template asks "What percent?", your question MUST ALSO ask "What percent?"
   - If the template is about finding a percentage FROM a fraction, your question must do the SAME
   - DO NOT change the problem type (don't turn a percentage problem into a money problem!)
   - DO NOT change what the question is asking for

2. PRESERVE THE MATHEMATICAL STRUCTURE:
   - Use the SAME mathematical operations in the SAME order
   - If template has "X out of Y, find percent", your question must have "X out of Y, find percent"
   ${questionCategory !== 'computation' ? '- Keep the same number of steps' : '- Computation problems are ALWAYS single-step (ignore any "number of steps" setting)'}
   - Keep the same calculation method

3. VARIATION INSTRUCTIONS (What you CAN change):
${
  customVariationInstructions
    ? customVariationInstructions
    : `- Change student names (use variety instructions above)
- Vary the specific numbers to get different answers
- Change the CONTEXT (e.g., "problems on a test" vs "free throws in basketball" vs "questions correct on quiz")
- But NEVER change the problem TYPE or structure`
}

4. DO NOT CHANGE:
   - The problem TYPE (percentage, money, time, etc.)
   - What the question is asking for
   - The mathematical structure or operations
   - The answer format (if template wants %, you give %)

5. EXAMPLES OF CORRECT VARIATION:

   Example A - Percentage Problem:
   Template: "Joe got 18 correct out of 20 problems. What percent did he get correct?"
   CORRECT Variation: "Maria made 15 out of 25 free throws. What percent did she make?"
   WRONG Variation: "Maria wants to buy a $50 item with a 15% discount. How much does she pay?" ← This changed the problem type!

   Example B - Money Word Problem:
   Template: "Rose has $30 and needs $100. She earns $20. How much more does she need?"
   CORRECT Variation: "Alex has $45 and needs $85. He earns $15. How much more does he need?"
   WRONG Variation: "Alex answered 15 out of 20 questions. What percent did he get?" ← This changed the problem type!

The key: Look at what the template is ASKING FOR (percent? money? time?) and make sure your question asks for the SAME THING.`
    : ''

  const assessmentMethod = goal.assessmentMethod || 'app'
  const assessmentMethodGuidance =
    assessmentMethod === 'app'
      ? 'This is an APP-based assessment (digital/automated). Generate questions that can be automatically graded. Avoid requiring photo uploads or manual grading.'
      : assessmentMethod === 'paper'
        ? 'This is a PAPER-based assessment (manual grading). Generate questions that may require students to show work, write essays, or demonstrate skills that need teacher evaluation. Photo uploads and rubrics are appropriate.'
        : 'This is a HYBRID assessment (combination of digital and paper). Generate questions that can include both automated and manual components.'

  // NEW: Question category specific guidance
  let categoryGuidance = ''
  if (questionCategory) {
    switch (questionCategory) {
      case 'computation':
        categoryGuidance = `

🧮 **QUESTION CATEGORY: COMPUTATION** 🧮

CRITICAL: This goal is about DIRECT COMPUTATION, not word problems.

✅ DO create:
- Direct calculation problems with proper formatting
- SINGLE-STEP direct operations (one calculation per problem)
- Straightforward operations like "Calculate: 143 + 23" or "Evaluate: 12 × 5"
- Equation solving (single-step)
- Expression evaluation (single-step)

❌ DO NOT create:
- Word problems or story problems
- Real-world scenarios or contexts
- Problems that require reading a paragraph
- Application problems in real-world situations
- MULTI-STEP problems (this is computation, not word problems - each problem should be ONE direct calculation)

⚠️ IMPORTANT: IGNORE any "number of steps" instruction. Computation problems are ALWAYS single-step direct calculations.

📐 **FORMATTING REQUIREMENTS FOR MULTI-DIGIT OPERATIONS**:

**For ADDITION (2+ digits) - Use STACKED/VERTICAL format**:
CORRECT:
$$\\\\begin{array}{r}
  143 \\\\\\\\
+ \\\\underline{\\\\phantom{0}23} \\\\\\\\
\\\\end{array}$$

**For SUBTRACTION (2+ digits) - Use STACKED/VERTICAL format**:
CORRECT:
$$\\\\begin{array}{r}
  143 \\\\\\\\
- \\\\underline{\\\\phantom{0}23} \\\\\\\\
\\\\end{array}$$

**For MULTIPLICATION (2+ digits) - Use STACKED/VERTICAL format**:
CORRECT:
$$\\\\begin{array}{r}
  143 \\\\\\\\
\\\\times \\\\underline{\\\\phantom{00}5} \\\\\\\\
\\\\end{array}$$

**For DIVISION (2+ digits) - Use LONG DIVISION format**:
CORRECT: $$5 \\\\overline{)143}$$
or: $$23 \\\\overline{)143}$$

**For single-digit or simple operations** - Use inline format:
- CORRECT: Calculate: $5 + 3$
- CORRECT: Calculate: $8 \\\\times 7$

**For fractions** - Use fraction notation:
- CORRECT: Calculate: $\\\\frac{3}{4} + \\\\frac{1}{2}$
- CORRECT: Evaluate: $\\\\frac{2}{3} \\\\times \\\\frac{3}{4}$

**For decimals** - Can use inline or stacked:
- Simple: Calculate: $1.2 + 3.2$
- Complex: Use stacked format like integers

**For expressions with parentheses**:
- CORRECT: Evaluate: $15 - (3 + 2) \\\\times 2$
- CORRECT: Simplify: $(8 + 4) \\\\div 3$

EXAMPLES:
✅ CORRECT (multi-digit stacked):
$$\\\\begin{array}{r}
  456 \\\\\\\\
+ \\\\underline{278} \\\\\\\\
\\\\end{array}$$

✅ CORRECT (long division): $$12 \\\\overline{)144}$$

✅ CORRECT (fraction): Calculate: $\\\\frac{3}{8} + \\\\frac{1}{4}$

✅ CORRECT (simple): Calculate: $7 \\\\times 8$

❌ WRONG: "Maria bought 3 books for $3.50 each. How much did she spend?" (This is a word problem, not computation)
❌ WRONG: Using inline format for multi-digit: "Calculate: 143 + 23" (Should be stacked)

**CRITICAL**: For any addition, subtraction, or multiplication with 2 or more digits in either number, ALWAYS use the stacked/vertical format shown above!`
        break

      case 'word-problem':
        categoryGuidance = `

📖 **QUESTION CATEGORY: WORD PROBLEM** 📖

This goal requires WORD PROBLEMS with real-world context.

✅ DO create:
- Real-world scenarios (shopping, cooking, sports, school, etc.)
- Story-based problems that require reading and interpretation
- Multi-step problems in context
- Application of math skills to practical situations

❌ DO NOT create:
- Direct computation without context (e.g., "Calculate: 5 + 3")
- Abstract equation solving without a story

EXAMPLES:
✅ CORRECT: "Rose is baking cookies. Each batch needs 3 cups of flour. If she makes 4 batches, how many cups does she need?"
✅ CORRECT: "Dylan bought 3 notebooks for $2.50 each. He paid with a $10 bill. How much change did he receive?"
❌ WRONG: "Calculate: 3 × 4" (Too direct, no context)`
        break

      case 'conceptual':
        categoryGuidance = `

🧠 **QUESTION CATEGORY: CONCEPTUAL UNDERSTANDING** 🧠

This goal tests UNDERSTANDING of concepts, not just calculation.

✅ DO create:
- Explanation questions (e.g., "Explain why...")
- Identification/recognition questions
- Comparison questions (e.g., "Which is greater and why?")
- Pattern recognition
- Demonstration of understanding

EXAMPLES:
✅ CORRECT: "Explain why $\\\\frac{1}{2}$ is equivalent to $\\\\frac{2}{4}$"
✅ CORRECT: "Identify which operation you would use to solve this problem and explain why"
❌ WRONG: "Calculate: 1/2 + 2/4" (This is computation, not conceptual)`
        break

      case 'application':
        categoryGuidance = `

🎯 **QUESTION CATEGORY: APPLICATION** 🎯

This goal requires applying skills in context (but not necessarily full word problems).

✅ DO create:
- Application of procedures in context
- Using skills to solve practical problems
- Transfer of knowledge to new situations

This is a middle ground between pure computation and full word problems.`
        break
    }
  }

  // If we have a template, PUT IT FIRST and suppress conflicting variety instructions
  const promptStart = templateReference
    ? `🚨🚨🚨 CRITICAL INSTRUCTION - READ THIS FIRST 🚨🚨🚨

${categoryGuidance ? `${categoryGuidance}\n\n⚠️⚠️⚠️ THE ABOVE QUESTION CATEGORY IS MANDATORY - YOU MUST FOLLOW IT! ⚠️⚠️⚠️\n` : ''}

YOU HAVE BEEN PROVIDED WITH A TEMPLATE QUESTION.
YOUR ONLY JOB IS TO CREATE A VARIATION OF THIS EXACT TEMPLATE.

${templateSection}

⛔ IGNORE ANY LATER INSTRUCTIONS ABOUT:
- Money problems, skateboards, or purchasing items (UNLESS the template is about these)
- Any scenario types that differ from the template
- Any problem types that differ from the template

✅ YOUR TASK:
Look at the template above. What is it asking for?
- If it asks "What percent?", your question MUST ask "What percent?"
- If it's about "X out of Y", your question MUST be about "X out of Y"
- If the answer is a percentage (90%), your answer MUST be a percentage
- DO NOT turn this into a different type of problem!

Now proceed with the question generation, keeping the template structure SACRED.

---

Generate an assessment question based on this IEP goal:

Goal Title: ${goal.goalTitle}
Goal Text: ${goal.goalText}
Area of Need: ${goal.areaOfNeed}
Subject: ${subject}
Grade Level: ${goal.gradeLevel || 'Not specified'}
Question Number: ${questionNumber}
Assessment Method: ${assessmentMethod.toUpperCase()}

${assessmentMethodGuidance}

🚨🚨🚨 CRITICAL VARIETY REQUIREMENTS - Question #${questionNumber} 🚨🚨🚨

⚠️ THIS QUESTION MUST BE COMPLETELY DIFFERENT FROM ALL PREVIOUS QUESTIONS:

1. **USE THIS STUDENT NAME**: ${studentName}
   ${questionNumber === 1 ? '(First question - establish a unique scenario)' : ''}
   ${questionNumber === 2 ? '(Second question - MUST have different answer and scenario from Q1)' : ''}
   ${questionNumber === 3 ? '(Third question - MUST have different answer and scenario from Q1 and Q2)' : ''}
   ${questionNumber === 4 ? '(Fourth question - MUST have different answer and scenario from Q1, Q2, and Q3)' : ''}
   ${questionNumber === 5 ? '(Fifth question - MUST have different answer and scenario from Q1, Q2, Q3, and Q4)' : ''}

2. **DIFFERENT ANSWER REQUIRED**:
   - Calculate your numbers to ensure the answer is UNIQUE
   - If this is question #${questionNumber}, make sure the answer is different from questions 1-${questionNumber - 1}
   - DO NOT generate questions that result in the same answer value
   - Example: If previous answer was "6", use numbers that result in "4", "8", "12", "15", etc. (NOT "6")

3. **DIFFERENT SCENARIO REQUIRED**:
   - Use a completely different context/situation
   - Change the activity, setting, or problem type dramatically
   - DO NOT reuse similar scenarios with just different names/numbers

4. **DIFFERENT NUMBERS REQUIRED**:
   - Use significantly different number ranges
   - Vary the calculations to produce different results
   - Avoid similar number patterns

REMEMBER: You are creating a VARIATION of the template shown above.
- ✅ DO: Change names, numbers, scenarios, and ensure DIFFERENT answer
- ❌ DON'T: Change the problem type or structure
- ❌ DON'T: Reuse similar scenarios or same answer values
${previousQuestionsSection}`
    : `${categoryGuidance ? `🚨🚨🚨 CRITICAL - READ THIS FIRST 🚨🚨🚨\n\n${categoryGuidance}\n\n⚠️⚠️⚠️ THE ABOVE QUESTION CATEGORY IS MANDATORY! ⚠️⚠️⚠️\nIF YOU CREATE A DIFFERENT TYPE OF QUESTION, IT WILL BE REJECTED!\n\n---\n\n` : ''}Generate an assessment question based on this IEP goal:

Goal Title: ${goal.goalTitle}
Goal Text: ${goal.goalText}
Area of Need: ${goal.areaOfNeed}
Subject: ${subject}
Grade Level: ${goal.gradeLevel || 'Not specified'}
Question Number: ${questionNumber}
Assessment Method: ${assessmentMethod.toUpperCase()}

${assessmentMethodGuidance}
${varietyInstructions}
${previousQuestionsSection}`

  return `${promptStart}
${operationConstraints}

Requirements:
1. The question must directly assess the skill described in the goal
2. For math: Include real-world scenarios when appropriate, ask students to show work
3. For ELA: Create age-appropriate reading/writing prompts
4. Make the question clear and appropriate for the student's grade level
5. Provide a complete answer with explanation
6. Consider the assessment method when deciding if photo uploads are needed
7. ⚠️⚠️⚠️ CRITICAL: Each question must be COMPLETELY UNIQUE ⚠️⚠️⚠️
   - DIFFERENT final answer (most important - calculate to ensure uniqueness)
   - DIFFERENT scenario/context (completely different situation)
   - DIFFERENT numbers (significantly different, not just slightly changed)
   - DIFFERENT items/objects (change what the problem is about)
   - DIFFERENT student name (use the name provided above)
   - DO NOT create questions that are similar to previous ones
   - DO NOT reuse the same answer value
   - DO NOT copy scenarios, just change names/numbers slightly

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${
  difficulty === 'easy'
    ? '- Use simple, single-digit or small double-digit numbers (1-20)\n- Focus ONLY on testing the specific goal skill\n- Keep all other math operations as simple as possible\n- Avoid mixing multiple math concepts\n- Use whole numbers only, no fractions or decimals\n- Keep word problems short and straightforward'
    : difficulty === 'hard'
      ? '- Use larger numbers (50-1000) or more complex calculations\n- Can mix multiple math concepts (e.g., fractions AND decimals)\n- Include multi-step problems that combine different skills\n- Use fractions, decimals, or mixed numbers when appropriate\n- Create more complex real-world scenarios\n- Require multiple operations or problem-solving steps'
      : '- Use moderate numbers (20-100)\n- May include simple fractions or decimals if relevant to the goal\n- Can combine 2 related math concepts if appropriate\n- Use moderately complex word problems\n- Balance between simple and complex operations'
}

IMPORTANT FOR SHORT-ANSWER MATH QUESTIONS:
- The answer must be a simple number or simple expression (e.g., "6", "x=6", "42")
- Include alternative acceptable answers that students might provide (different formats of the SAME answer)
- DO NOT include incorrect answers (e.g., don't include "-6" if the answer is "6")
- Examples of CORRECT alternatives for answer "6": ["6", "6.0", "6.00", "+6", "x=6", "X=6"]
- Examples of CORRECT alternatives for answer "5 hours": ["5 hours", "5", "5.0", "five hours"]
- Format alternatives as an array of strings
- Keep answers simple - avoid complex explanations in the answer field

ANSWER AFFIXES (Prefix/Suffix):
- If the answer needs a prefix (like "x="), include it: "answerPrefix": "x="
- If the answer needs a suffix (like "hours", "dollars", "feet"), include it: "answerSuffix": " hours"
- Examples:
  * For "x=6": "answer": "6", "answerPrefix": "x="
  * For "5 hours": "answer": "5", "answerSuffix": " hours"
  * For "$42": "answer": "42", "answerPrefix": "$"
- This helps students know the expected format and enables flexible grading

⚠️ CRITICAL JSON FORMAT REQUIREMENT:
- You MUST return ONLY a valid JSON object
- Do NOT include any introductory text, markdown code blocks (like \`\`\`json), or conversational filler
- Do NOT add explanations outside the JSON structure
- Your entire response must be parseable by JSON.parse()
- Start your response with { and end with }
- Keep the 'explanation' extremely short (1-2 sentences)
- If you run out of space, ensure you have closed the 'question' and 'answer' fields properly
- NEVER use markdown backticks

Return your response as JSON with this exact format:
{
  "question": "The full question text here",
  "answer": "6",  // Simple answer: just the number or simple expression
  "answerPrefix": "x=",  // Optional: prefix like "x=" or "$" (empty string if none)
  "answerSuffix": " hours",  // Optional: suffix like " hours", " dollars", " feet" (empty string if none)
  "alternativeAnswers": ["6", "6.0", "+6", "x=6"],  // Only CORRECT alternative formats
  "explanation": "Optional explanation of the solution",
  "requiresPhoto": true or false
}

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no *, -, #, etc.) in the question text
- Use plain text with line breaks (\\n) for multi-line questions
- For lists, use numbered items (1), 2), 3)) or plain text, NOT markdown bullets
- Keep the question text clean and readable without special formatting characters
- **CRITICAL: ALL LaTeX/KaTeX expressions MUST be wrapped in dollar signs ($...$ or $$...$$)**
- **NEVER write LaTeX commands without dollar signs - they will NOT render!**
- Use $...$ for inline math (e.g., $x = 5$) and $$...$$ for standalone equations.
- **IMPORTANT**: When using LaTeX commands in JSON, you MUST use DOUBLE BACKSLASHES.
- Example: For fractions, use "$\\\\frac{1}{2}$" (double backslash, WITH dollar signs)
- Example: For square roots, use "$\\\\sqrt{25}$" (double backslash, WITH dollar signs)
- **WRONG**: "Calculate \\\\frac{1}{2}" (no dollar signs - will NOT render!)
- **CORRECT**: "Calculate $\\\\frac{1}{2}$" (with dollar signs - will render!)
- This is because JSON strings treat single backslash as an escape character.
- **CRITICAL FOR MONEY (DOLLAR AMOUNTS)**: Wrap dollar amounts in math mode with escaped dollar sign:
  * CORRECT: "$\\\\$18.25$" (renders as $18.25)
  * WRONG: "$18.25" (breaks KaTeX rendering)
  * Example: "Rose buys a book for $\\\\$18.25$ and a magazine for $\\\\$9.50$. If she pays with a $\\\\$30$ bill, how much change will she receive?"
  * Always use: $\\\\$[amount]$ for any dollar amount in the question text

Example for a multi-step math goal:
{
  "question": "Carter scored 14 and 12 points in his first two basketball games. He scored twice as many points in his third game as the first two games combined.\\n\\n1) Write a numerical expression representing this problem\\n2) Calculate the answer\\n3) Show your work",
  "answer": "52",
  "answerPrefix": "",
  "answerSuffix": " points",
  "alternativeAnswers": ["52", "52 points", "52.0", "fifty-two", "52.00"],
  "explanation": "First add the points from the first two games: 14 + 12 = 26. Then multiply by 2: 26 × 2 = 52.",
  "requiresPhoto": true
}

Example for a simple equation:
{
  "question": "Solve for x: 2x + 4 = 16",
  "answer": "6",
  "answerPrefix": "x=",
  "answerSuffix": "",
  "alternativeAnswers": ["6", "6.0", "x=6", "X=6"],
  "explanation": "Subtract 4 from both sides: 2x = 12. Divide by 2: x = 6.",
  "requiresPhoto": false
}

Example for a money problem:
{
  "question": "Maria has $\\\\$35.50$. She buys a book for $\\\\$12.75$. How much money does she have left?",
  "answer": "22.75",
  "answerPrefix": "$",
  "answerSuffix": "",
  "alternativeAnswers": ["22.75", "$22.75", "22.8", "$22.8"],
  "explanation": "Subtract the cost from the total: $35.50 - $12.75 = $22.75",
  "requiresPhoto": false
}${templateSection}

🚨🚨🚨 FINAL REMINDER - VARIETY IS CRITICAL 🚨🚨🚨

Before generating your question, ask yourself:
1. ✅ Is my final answer DIFFERENT from what would be in previous questions?
2. ✅ Is my scenario/context COMPLETELY DIFFERENT (not just slightly changed)?
3. ✅ Are my numbers SIGNIFICANTLY DIFFERENT (not just $32.25 vs $32.75)?
4. ✅ Am I using a DIFFERENT student name (${studentName})?
5. ✅ Are the items/objects in my problem DIFFERENT?

If you answered NO to any of these, CHANGE YOUR QUESTION NOW!

⚠️ DO NOT generate:
- Questions with the same answer value
- Questions with similar scenarios (e.g., "buying skateboard" repeated)
- Questions with only slightly different numbers
- Questions that are essentially copies with different names

✅ DO generate:
- Questions with UNIQUE answers
- Questions with COMPLETELY different scenarios
- Questions with SIGNIFICANTLY different numbers
- Questions that feel fresh and different

Now generate the question:`
}

/**
 * Auto-wrap LaTeX expressions in dollar signs if they're not already wrapped
 * Handles both escaped (\\frac) and unescaped (\frac) LaTeX commands
 */
function wrapLatexInDollars(text: string): string {
  if (!text) return text

  // Helper to check if a position is already inside dollar signs
  const isInsideDollars = (str: string, pos: number): boolean => {
    const before = str.substring(0, pos)
    const dollarCount = (before.match(/\$/g) || []).length
    return dollarCount % 2 === 1
  }

  let result = text

  // Pattern 1: \\frac{}{} or \frac{}{} - most common (handles escaped backslashes from JSON)
  result = result.replace(
    /([^$])(\\{1,2}frac\{[^}]+\}\{[^}]+\})([^$])/g,
    (match, before, latex, after, offset) => {
      if (isInsideDollars(result, offset)) return match
      return before + '$' + latex + '$' + after
    },
  )

  // Pattern 2: \\sqrt{} or \sqrt{}
  result = result.replace(
    /([^$])(\\{1,2}sqrt\{[^}]+\})([^$])/g,
    (match, before, latex, after, offset) => {
      if (isInsideDollars(result, offset)) return match
      return before + '$' + latex + '$' + after
    },
  )

  // Pattern 3: \\begin{array}...\\end{array} (multi-line, handles escaped backslashes)
  result = result.replace(
    /([^$])(\\{1,2}begin\{array\}[^]*?\\{1,2}end\{array\})([^$])/gs,
    (match, before, latex, after, offset) => {
      if (isInsideDollars(result, offset)) return match
      return before + '$$' + latex + '$$' + after
    },
  )

  // Pattern 4: Other common LaTeX commands with braces (\\overline{}, etc.)
  const singleArgCommands = ['overline', 'underline', 'phantom']
  singleArgCommands.forEach((cmd) => {
    result = result.replace(
      new RegExp(`([^$])(\\\\{1,2}${cmd}\\{[^}]+\\})([^$])`, 'g'),
      (match, before, latex, after, offset) => {
        if (isInsideDollars(result, offset)) return match
        return before + '$' + latex + '$' + after
      },
    )
  })

  // Pattern 5: Standalone LaTeX commands like \\times, \\div, \\pi (handles escaped)
  const standaloneCommands = [
    'times',
    'div',
    'pm',
    'mp',
    'pi',
    'theta',
    'alpha',
    'beta',
    'cdot',
    'approx',
    'neq',
    'leq',
    'geq',
  ]
  standaloneCommands.forEach((cmd) => {
    result = result.replace(
      new RegExp(`([^$\\\\])(\\\\{1,2}${cmd})([^$\\\\{])`, 'g'),
      (match, before, latex, after, offset) => {
        if (isInsideDollars(result, offset)) return match
        return before + '$' + latex + '$' + after
      },
    )
  })

  return result
}

/**
 * Clean question text by removing leading/trailing newlines and markdown formatting
 */
function cleanQuestionText(text: string): string {
  if (!text) return text
  let cleaned = text
    .trim()
    .replace(/^\n+/, '') // Remove leading newlines
    .replace(/\n+$/, '') // Remove trailing newlines
    .replace(/^\*\s+/, '') // Remove leading markdown bullet
    .replace(/\n\*\s+/g, '\n• ') // Convert markdown bullets to bullet points
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to max 2
    .replace(/\\n/g, '\n') // Convert escaped newlines to actual newlines
    .replace(/\\\*/g, '*') // Convert escaped asterisks
    .replace(/^\*\s+/, '') // Remove any remaining leading markdown bullets
    .trim()

  // Auto-wrap LaTeX expressions in dollar signs
  cleaned = wrapLatexInDollars(cleaned)

  return cleaned
}

/**
 * Parse text response if JSON parsing fails
 */
function parseTextResponse(content: string): QuestionResult {
  // Try to extract question and answer from text
  const questionMatch = content.match(/question["\s:]*["']?([^"']+)["']?/i)
  const answerMatch = content.match(/answer["\s:]*["']?([^"']+)["']?/i)

  const question = questionMatch?.[1] || content.split('\n')[0] || 'Error parsing question'
  const answer = answerMatch?.[1] || 'N/A'

  return {
    question: cleanQuestionText(question),
    answer: answer.trim(),
    requiresPhoto: true,
  }
}

/**
 * Check if AI generation should be used for this goal
 * Returns true if goal doesn't match common patterns
 */
export function shouldUseAI(goal: Goal): boolean {
  const goalText = goal.goalText.toLowerCase()

  // Common patterns that work well with templates
  const commonPatterns = [
    'multi-step.*real-world.*scenario',
    'word problem',
    'multiplication',
    'division',
    'addition',
    'subtraction',
    'fraction',
    'equation',
  ]

  // If goal matches common pattern, use template (faster, free)
  const matchesCommonPattern = commonPatterns.some((pattern) => {
    const regex = new RegExp(pattern)
    return regex.test(goalText)
  })

  // Use AI for unique/complex goals
  return !matchesCommonPattern
}

/**
 * Cache key for question generation
 * Questions for similar goals can be cached
 */
export function getCacheKey(goal: Goal, questionNumber: number): string {
  // Create a simple hash based on goal text and question number
  const text = `${goal.goalText}-${questionNumber}`
  return btoa(text).substring(0, 50) // Simple base64 encoding
}
