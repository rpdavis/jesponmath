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

import type { Goal } from '@/types/iep'

export interface QuestionResult {
  question: string
  answer: string
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
  provider: 'openai',
  model: 'gpt-3.5-turbo', // Cheaper option, can upgrade to gpt-4 for better quality
  temperature: 0.7, // Balance between creativity and consistency
  maxTokens: 500,
}

// Default Gemini model (updated to current API)
// Use gemini-2.5-flash for fast generation (latest)
// Use gemini-2.5-pro for better quality
// Use gemini-flash-latest for stable, auto-updating model
const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest' // Auto-updating to latest stable flash model

/**
 * Generate a question using AI based on the goal
 */
export async function generateQuestionWithAI(
  goal: Goal,
  subject: 'math' | 'ela' | 'other',
  questionNumber: number,
  config?: Partial<AIGeneratorConfig>,
  templateReference?: QuestionResult,
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
        )
      case 'anthropic':
        return await generateWithAnthropic(
          goal,
          subject,
          questionNumber,
          apiKey,
          finalConfig,
          templateReference,
        )
      case 'google':
        return await generateWithGoogle(
          goal,
          subject,
          questionNumber,
          apiKey,
          finalConfig,
          templateReference,
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
): Promise<QuestionResult> {
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    config.difficulty || 'medium',
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
            'You are an expert educational assessment question generator. Generate questions that are appropriate for students with IEP goals. Always return valid JSON.',
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
      alternativeAnswers: parsed.alternativeAnswers || parseAlternativesFromAnswer(parsed.answer),
      explanation: parsed.explanation
        ? parsed.explanation.trim().replace(/^\n+/, '').replace(/\n+$/, '')
        : undefined,
      requiresPhoto: parsed.requiresPhoto !== false, // Default to true for math
      source: 'ai',
    }
  } catch (parseError) {
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
): Promise<QuestionResult> {
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    config.difficulty || 'medium',
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
): Promise<QuestionResult> {
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    config.difficulty || 'medium',
  )

  // Try different models in order of preference
  const modelAttempts = [
    'gemini-2.0-flash', // Stable model that works
    'gemini-2.5-flash', // Latest fast model
    config.model || DEFAULT_GEMINI_MODEL, // User's choice or default
    'gemini-flash-latest', // Auto-updating model
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
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 1000, // Increased for JSON responses
          apiKey,
        })

        const data = result.data as any
        if (data.success && data.content) {
          content = data.content
          break // Success!
        } else {
          lastError = new Error(`Model ${model} failed: ${data.error || 'No content returned'}`)
        }
      } catch (e: any) {
        lastError = new Error(`Model ${model} error: ${e.message || 'Unknown error'}`)
      }
    }
  } catch (e: any) {
    // If Firebase Functions fail, throw error
    throw new Error(`Firebase Functions error: ${e.message}`)
  }

  if (!content) {
    throw lastError || new Error('Failed to generate with Google API')
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
    const result = parseTextResponse(content)
    return {
      ...result,
      alternativeAnswers: parseAlternativesFromAnswer(result.answer),
      source: 'ai',
    }
  }
}

/**
 * Helper function to extract alternatives from answer if not provided
 */
function parseAlternativesFromAnswer(answer: string): string[] {
  if (!answer) return []

  const alternatives: string[] = [answer.trim()]

  // If answer is a number, add common variations
  const numMatch = answer.match(/(-?\d+\.?\d*)/)
  if (numMatch) {
    const num = numMatch[1]
    const numValue = parseFloat(num)

    // Add variations
    alternatives.push(num) // "6"
    if (numValue > 0) {
      alternatives.push(`-${num}`) // "-6" if positive
      alternatives.push(`+${num}`) // "+6"
    }
    alternatives.push(`x=${num}`) // "x=6"
    alternatives.push(`${num}.0`) // "6.0"
    if (!num.includes('.')) {
      alternatives.push(`${num}.00`) // "6.00"
    }

    // If answer contains "x=" or variable, add variations
    if (answer.includes('=')) {
      const parts = answer.split('=')
      if (parts.length === 2) {
        const value = parts[1].trim()
        alternatives.push(value) // Just the value
        alternatives.push(`x=${value}`) // x=value
        alternatives.push(`X=${value}`) // X=value
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
): string {
  const templateSection = templateReference
    ? `

TEMPLATE REFERENCE (use as a style guide, but generate a DIFFERENT question):
Question: ${templateReference.question}
Answer: ${templateReference.answer}
${templateReference.explanation ? `Explanation: ${templateReference.explanation}` : ''}
Note: Generate a similar question but with different numbers/scenarios. Keep the same format and structure.`
    : ''

  const assessmentMethod = goal.assessmentMethod || 'app'
  const assessmentMethodGuidance =
    assessmentMethod === 'app'
      ? 'This is an APP-based assessment (digital/automated). Generate questions that can be automatically graded. Avoid requiring photo uploads or manual grading.'
      : assessmentMethod === 'paper'
        ? 'This is a PAPER-based assessment (manual grading). Generate questions that may require students to show work, write essays, or demonstrate skills that need teacher evaluation. Photo uploads and rubrics are appropriate.'
        : 'This is a HYBRID assessment (combination of digital and paper). Generate questions that can include both automated and manual components.'

  return `Generate an assessment question based on this IEP goal:

Goal Title: ${goal.goalTitle}
Goal Text: ${goal.goalText}
Area of Need: ${goal.areaOfNeed}
Subject: ${subject}
Grade Level: ${goal.gradeLevel || 'Not specified'}
Question Number: ${questionNumber}
Assessment Method: ${assessmentMethod.toUpperCase()}

${assessmentMethodGuidance}

Requirements:
1. The question must directly assess the skill described in the goal
2. For math: Include real-world scenarios when appropriate, ask students to show work
3. For ELA: Create age-appropriate reading/writing prompts
4. Make the question clear and appropriate for the student's grade level
5. Provide a complete answer with explanation
6. Consider the assessment method when deciding if photo uploads are needed

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${
  difficulty === 'easy'
    ? '- Use simple, single-digit or small double-digit numbers (1-20)\n- Focus ONLY on testing the specific goal skill\n- Keep all other math operations as simple as possible\n- Avoid mixing multiple math concepts\n- Use whole numbers only, no fractions or decimals\n- Keep word problems short and straightforward'
    : difficulty === 'hard'
      ? '- Use larger numbers (50-1000) or more complex calculations\n- Can mix multiple math concepts (e.g., fractions AND decimals)\n- Include multi-step problems that combine different skills\n- Use fractions, decimals, or mixed numbers when appropriate\n- Create more complex real-world scenarios\n- Require multiple operations or problem-solving steps'
      : '- Use moderate numbers (20-100)\n- May include simple fractions or decimals if relevant to the goal\n- Can combine 2 related math concepts if appropriate\n- Use moderately complex word problems\n- Balance between simple and complex operations'
}

IMPORTANT FOR SHORT-ANSWER MATH QUESTIONS:
- The answer must be a simple number or simple expression (e.g., "6", "-6", "x=6", "42")
- Include alternative acceptable answers that students might provide
- Examples: If answer is 6, alternatives might be: "6", "-6", "x=6", "+6", "6.0"
- Format alternatives as an array of strings
- Keep answers simple - avoid complex explanations in the answer field

Return your response as JSON with this exact format:
{
  "question": "The full question text here",
  "answer": "6",  // Simple answer: just the number or simple expression
  "alternativeAnswers": ["6", "-6", "x=6", "+6"],  // Alternative formats students might use (optional)
  "explanation": "Optional explanation of the solution",
  "requiresPhoto": true or false
}

IMPORTANT FORMATTING RULES:
- Do NOT use markdown formatting (no *, -, #, etc.) in the question text
- Use plain text with line breaks (\n) for multi-line questions
- For lists, use numbered items (1), 2), 3)) or plain text, NOT markdown bullets
- Keep the question text clean and readable without special formatting characters

Example for a multi-step math goal:
{
  "question": "Carter scored 14 and 12 points in his first two basketball games. He scored twice as many points in his third game as the first two games combined.\\n\\n1) Write a numerical expression representing this problem\\n2) Calculate the answer\\n3) Show your work",
  "answer": "52",
  "alternativeAnswers": ["52", "52 points", "fifty-two"],
  "explanation": "First add the points from the first two games: 14 + 12 = 26. Then multiply by 2: 26 × 2 = 52.",
  "requiresPhoto": true
}

Example for a simple math question:
{
  "question": "Solve for x: 2x + 4 = 16",
  "answer": "6",
  "alternativeAnswers": ["6", "-6", "x=6", "+6", "6.0"],
  "explanation": "Subtract 4 from both sides: 2x = 12. Divide by 2: x = 6.",
  "requiresPhoto": false
}${templateSection}

Now generate the question:`
}

/**
 * Clean question text by removing leading/trailing newlines and markdown formatting
 */
function cleanQuestionText(text: string): string {
  if (!text) return text
  return text
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
