/**
 * AI Answer Generator Service
 *
 * Uses AI (Google Gemini via Firebase Functions) to auto-generate
 * correct answers, alternative answers, and answer prefixes
 * for assessment questions.
 *
 * Supports:
 * - Short answer: generates correctAnswer, alternativeAnswers, answerPrefix
 * - Multiple choice: generates options and correctAnswer index
 */

import { getAIModel } from '@/config/aiModels'

export interface ShortAnswerResult {
  correctAnswer: string
  alternativeAnswers: string[]
  answerPrefix: string
  answerSuffix: string
  explanation: string
}

export interface MultipleChoiceResult {
  options: string[]
  correctAnswerIndex: number
  explanation: string
}

/**
 * Generate the correct answer for a short-answer question using AI.
 * Also generates alternative acceptable answers and detects prefix/suffix.
 */
export async function generateShortAnswer(questionText: string): Promise<ShortAnswerResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured (VITE_GEMINI_API_KEY)')
  }

  const prompt = buildShortAnswerPrompt(questionText)
  const content = await callGemini(prompt, apiKey)
  return parseShortAnswerResponse(content)
}

/**
 * Generate multiple choice options and the correct answer for a question using AI.
 */
export async function generateMultipleChoiceAnswer(questionText: string): Promise<MultipleChoiceResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured (VITE_GEMINI_API_KEY)')
  }

  const prompt = buildMultipleChoicePrompt(questionText)
  const content = await callGemini(prompt, apiKey)
  return parseMultipleChoiceResponse(content)
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function buildShortAnswerPrompt(questionText: string): string {
  return `You are an expert math teacher. Given the following math question, provide the correct answer.

QUESTION:
${questionText}

RULES:
1. Provide the correct numerical or algebraic answer.
2. If the answer is a single variable equation result (like x=5, y=12, n=3), then:
   - Set "answerPrefix" to the variable and equals sign (e.g. "x=" or "y=" or "n=")
   - Set "correctAnswer" to ONLY the value (e.g. "5" not "x=5")
3. If the answer has units (e.g. "5 apples", "12 dollars", "3 hours"), then:
   - Set "correctAnswer" to ONLY the number (e.g. "5")
   - Set "answerSuffix" to the unit (e.g. " apples" or " dollars")
4. If the answer is just a plain number or expression, leave answerPrefix and answerSuffix as empty strings.
5. Provide 2-4 alternative acceptable answers. These should be CORRECT equivalent forms:
   - Different decimal representations (e.g. "6" and "6.0")
   - Equivalent fractions (e.g. "1/2" and "2/4")
   - With/without positive sign (e.g. "5" and "+5")
   - Simplified vs unsimplified forms
   DO NOT include wrong answers as alternatives.
6. Provide a brief explanation of how to solve the problem.

RESPONSE FORMAT - Return ONLY valid JSON, no markdown, no code blocks:
{
  "correctAnswer": "the answer value only",
  "alternativeAnswers": ["alt1", "alt2"],
  "answerPrefix": "",
  "answerSuffix": "",
  "explanation": "brief explanation"
}`
}

function buildMultipleChoicePrompt(questionText: string): string {
  return `You are an expert math teacher. Given the following math question, generate 4 multiple choice options where exactly one is correct.

QUESTION:
${questionText}

RULES:
1. Generate exactly 4 answer options.
2. Exactly one option must be the correct answer.
3. The 3 wrong options (distractors) should be plausible but clearly wrong. Common mistakes students make are good distractors.
4. Options should be concise (short text or numbers).
5. If the question involves math, use LaTeX wrapped in $...$ for math expressions in options.
6. Order the options logically (e.g. ascending numbers, or alphabetically).
7. Provide a brief explanation of why the correct answer is right.

RESPONSE FORMAT - Return ONLY valid JSON, no markdown, no code blocks:
{
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswerIndex": 0,
  "explanation": "brief explanation"
}`
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const model = getAIModel('AI_QUESTIONS')

  // Use Firebase Functions to avoid CORS issues (same pattern as aiQuestionGenerator.ts)
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const { app } = await import('@/firebase/config')
    const functions = getFunctions(app, 'us-west1')
    const generateWithGemini = httpsCallable(functions, 'generateWithGemini')

    const modelAttempts = [
      model,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ]

    let lastError: Error | null = null

    for (const modelName of modelAttempts) {
      try {
        const result = await generateWithGemini({
          model: modelName,
          prompt,
          temperature: 0.3, // Low temperature for accurate answers
          maxTokens: 1000,
          apiKey,
        })

        const data = result.data as { success: boolean; content?: string; error?: string }
        if (data.success && data.content) {
          console.log(`✅ AI answer generated with model: ${modelName}`)
          return data.content
        } else {
          lastError = new Error(`Model ${modelName} failed: ${data.error || 'No content'}`)
        }
      } catch (e: unknown) {
        const error = e as Error
        lastError = new Error(`Model ${modelName} error: ${error.message}`)
      }
    }

    throw lastError || new Error('All Gemini models failed')
  } catch (e: unknown) {
    const error = e as Error
    throw new Error(`Firebase Functions error: ${error.message}`)
  }
}

function extractJson(content: string): any {
  // Try to extract JSON object from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  let cleanJson = jsonMatch ? jsonMatch[0] : content

  // Fix unterminated strings
  const quoteCount = (cleanJson.match(/"/g) || []).length
  if (quoteCount % 2 !== 0) {
    cleanJson += '"}'
  } else if (!cleanJson.trim().endsWith('}')) {
    cleanJson += '}'
  }

  return JSON.parse(cleanJson)
}

function parseShortAnswerResponse(content: string): ShortAnswerResult {
  try {
    const parsed = extractJson(content)

    return {
      correctAnswer: (parsed.correctAnswer || '').toString().trim(),
      alternativeAnswers: Array.isArray(parsed.alternativeAnswers)
        ? parsed.alternativeAnswers.map((a: any) => a.toString().trim()).filter((a: string) => a.length > 0)
        : [],
      answerPrefix: (parsed.answerPrefix || '').toString(),
      answerSuffix: (parsed.answerSuffix || '').toString(),
      explanation: (parsed.explanation || '').toString().trim(),
    }
  } catch (e) {
    console.error('❌ Failed to parse short answer AI response:', e)
    console.error('Raw content:', content.substring(0, 500))
    throw new Error('Failed to parse AI response for short answer')
  }
}

function parseMultipleChoiceResponse(content: string): MultipleChoiceResult {
  try {
    const parsed = extractJson(content)

    const options = Array.isArray(parsed.options) ? parsed.options.map((o: any) => o.toString().trim()) : []
    let correctIndex = parseInt(parsed.correctAnswerIndex, 10)

    // Validate index
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = 0
    }

    // Ensure we have at least 4 options
    while (options.length < 4) {
      options.push('')
    }

    return {
      options,
      correctAnswerIndex: correctIndex,
      explanation: (parsed.explanation || '').toString().trim(),
    }
  } catch (e) {
    console.error('❌ Failed to parse multiple choice AI response:', e)
    console.error('Raw content:', content.substring(0, 500))
    throw new Error('Failed to parse AI response for multiple choice')
  }
}
