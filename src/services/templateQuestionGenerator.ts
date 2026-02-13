// Template Question Generator Service
// Generates 5 initial template questions for a goal template using AI

import { functions } from '@/firebase/config'
import { httpsCallable } from 'firebase/functions'
import type { TemplateQuestion, Goal } from '@/types/iep'
import { getAIModel, AI_TEMPERATURES, AI_TOKEN_LIMITS } from '@/config/aiModels'
import { ensureLatexWrapped } from '@/utils/latexUtils'

interface GenerateTemplateQuestionsParams {
  goalText: string
  goalTitle: string
  areaOfNeed: string
  gradeLevel?: number
  standard?: string
  numberOfQuestions?: number // Default: 5
  // NEW: Template-specific settings
  exampleQuestion?: string
  exampleAnswer?: string
  exampleExplanation?: string
  customAIPrompt?: string
  questionCategory?: string
  allowedOperations?: string[]
  problemStructure?: any
}

interface GenerateTemplateQuestionsResponse {
  questions: TemplateQuestion[]
  error?: string
}

/**
 * Generate 5 template questions using AI based on goal details
 */
export async function generateTemplateQuestions(
  params: GenerateTemplateQuestionsParams,
): Promise<TemplateQuestion[]> {
  try {
    const numberOfQuestions = params.numberOfQuestions || 5

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY not configured. Please add it to your .env file.')
    }

    // Build detailed AI prompt
    const prompt = buildTemplateQuestionsPrompt(params, numberOfQuestions)

    // Call Firebase function to generate with Gemini
    const generateWithGemini = httpsCallable<
      { model: string; prompt: string; apiKey: string; temperature?: number; maxTokens?: number },
      { success: boolean; content?: string; response?: string; error?: string }
    >(functions, 'generateWithGemini')

    console.log('🤖 Generating template questions with AI...')
    const result = await generateWithGemini({
      model: getAIModel('TEMPLATE_QUESTIONS'),
      prompt,
      apiKey,
      temperature: AI_TEMPERATURES.MEDIUM,
      maxTokens: AI_TOKEN_LIMITS.LONG, // Use LONG for complex LaTeX computation problems
    })

    // Parse AI response
    const data = result.data
    if (!data.success || !data.content) {
      throw new Error(data.error || 'Failed to generate questions')
    }

    const aiResponse = data.content
    console.log('AI Response:', aiResponse)

    // Extract JSON from response
    const questions = parseAIResponse(aiResponse, numberOfQuestions)

    return questions
  } catch (error) {
    console.error('Error generating template questions:', error)
    throw new Error(
      `Failed to generate template questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Build the AI prompt for generating template questions
 */
function buildTemplateQuestionsPrompt(
  params: GenerateTemplateQuestionsParams,
  numberOfQuestions: number,
): string {
  const {
    goalText,
    goalTitle,
    areaOfNeed,
    gradeLevel,
    standard,
    exampleQuestion,
    exampleAnswer,
    exampleExplanation,
    customAIPrompt,
    questionCategory,
    allowedOperations,
  } = params

  // Build question category specific instructions
  let categoryInstructions = ''
  if (questionCategory === 'computation') {
    categoryInstructions = `
⚠️⚠️⚠️ **CRITICAL - QUESTION TYPE OVERRIDE** ⚠️⚠️⚠️
The Question Category is set to: **COMPUTATION (Direct calculations in stacked format)**

This means:
- ❌ NO word problems, NO stories, NO real-world scenarios
- ❌ NO variables like "Sarah", "John", "store", "garden", etc.
- ✅ ONLY direct mathematical expressions in stacked vertical format
- ✅ Use \\\\begin{array}{r} ... \\\\end{array} for vertical stacking
- ✅ Example: "Solve: \\\\begin{array}{r} 456 \\\\\\\\ + 234 \\\\\\\\ \\\\hline \\\\end{array}"
- ✅ For long division: Use \\\\longdiv{divisor}{dividend} format (e.g., $\\\\longdiv{45}{345}$ for 345 ÷ 45)
- ✅ For fractions: Use \\\\frac{}{} format

This setting OVERRIDES all other instructions. If the custom instructions mention word problems, IGNORE that part and create ONLY computation problems.
`
  } else if (questionCategory === 'word-problem') {
    categoryInstructions = `
⚠️ **QUESTION TYPE**: Word Problem (Story-based scenarios)
- Create real-world story problems
- Include context and scenarios
- Use varied settings (shopping, sports, cooking, etc.)
`
  }

  return `You are an expert math educator creating template questions for IEP (Individualized Education Program) goals.

**IMPORTANT FORMATTING INSTRUCTIONS:**
1. Use **double backslashes** for all LaTeX commands in your JSON output (e.g., \\\\frac{1}{3}, \\\\times, \\\\longdiv{divisor}{dividend})
2. **🔥 CRITICAL: ALL LaTeX must be wrapped in $...$ or $$...$$ 🔥**
   - Inline math: $\\\\frac{1}{2}$
   - Display/stacked: $$\\\\begin{array}{r} 12 \\\\\\\\ + 3 \\\\\\\\ \\\\hline \\\\end{array}$$
   - Math symbols: $\\\\times$, $\\\\div$, $\\\\pi$
   - **WRONG**: "Calculate \\\\frac{1}{2}" (will NOT render!)
   - **CORRECT**: "Calculate $\\\\frac{1}{2}$" (will render!)
3. For dollar amounts in QUESTION TEXT, wrap them in math mode: $\\\\$18.25$
4. For stacked vertical problems, use $$\\\\begin{array}{r} ... \\\\end{array}$$ format
5. ⚠️ **CRITICAL**: Do NOT wrap the correctAnswer field in LaTeX math delimiters ($...$)
   - ✅ CORRECT: "correctAnswer": "7h" or "correctAnswer": "15"
   - ❌ WRONG: "correctAnswer": "$7h$" or "correctAnswer": "$7 \\\\times h$"
   - The answer should be plain text without $ symbols (unless it's an actual dollar amount like "7.50")

${categoryInstructions}

**Goal Information:**
- Goal Title: ${goalTitle}
- Goal Text: ${goalText}
- Area of Need: ${areaOfNeed}
${gradeLevel ? `- Grade Level: ${gradeLevel}` : ''}
${standard ? `- Standard: ${standard}` : ''}
${allowedOperations && allowedOperations.length > 0 ? `- Allowed Operations: ${allowedOperations.join(', ')}` : ''}

${
  exampleQuestion
    ? `**TEMPLATE EXAMPLE (MOST IMPORTANT - FOLLOW THIS CLOSELY):**
Question: ${exampleQuestion}
Answer: ${exampleAnswer || ''}
${exampleExplanation ? `Explanation: ${exampleExplanation}` : ''}

⚠️ **CRITICAL**: Your generated questions MUST follow the same format, structure, and style as this example question. This is the most important part of the template!
`
    : ''
}

${
  customAIPrompt
    ? `**CUSTOM INSTRUCTIONS (HIGH PRIORITY):**
${customAIPrompt}

⚠️ Follow these instructions exactly${questionCategory === 'computation' ? ', but remember: NO word problems - only direct computation' : ''}.
`
    : ''
}

**Your Task:**
Generate exactly ${numberOfQuestions} diverse template questions that align with this IEP goal. ${exampleQuestion ? 'Each question should follow the EXACT format and structure of the example question above.' : 'These questions will serve as the template/model for generating assessment variations.'}

**Requirements:**
1. Create ${numberOfQuestions} DIFFERENT questions covering different aspects or variations of the goal
2. ${exampleQuestion ? 'Match the format and structure of the example question EXACTLY' : 'Use varied numbers, contexts, and scenarios'}
3. ${questionCategory === 'computation' ? 'Create ONLY direct computation problems (no word problems, no stories)' : 'Ensure questions match the grade level and skill described in the goal'}
4. Each question should be complete and ready to use
5. Include correct answers and any acceptable alternative answers
6. Set appropriate point values (typically 1-2 points per question)
7. **Keep explanations BRIEF and CLEAR** (1-3 sentences max) - avoid lengthy step-by-step breakdowns

**Question Variety Guidelines:**
${
  questionCategory === 'computation'
    ? `
- Create ONLY direct computation problems in stacked format
- NO word problems or story contexts
- Include different operations (addition, subtraction, multiplication, division, fractions, decimals as requested)
- Vary the numbers used - avoid repetitive patterns
- Each question should be a different operation or number type but still pure computation
`
    : `
- If the goal mentions "whole numbers, fractions, OR decimals" → Create questions with ALL three types
- If the goal mentions multiple operations → Include questions with different operations
- If word problems → Use different contexts (shopping, sports, school, cooking, etc.)
- Vary the numbers used - avoid repetitive patterns
- Each question should be distinctly different but still align with the same goal
`
}

**Output Format:**
Return ONLY a JSON array of questions (no additional text). Each question must have this structure:

[
  {
    "id": "q1",
    "questionText": "The question text here (use double backslashes for LaTeX: \\\\frac{1}{2})",
    "questionType": "short-answer",
    "correctAnswer": "42",
    "acceptableAnswers": ["42.0", "forty-two"],
    "points": 1,
    "explanation": "Brief explanation of how to solve",
    "standard": "${standard || '7.NS.A.1'}"
  },
  {
    "id": "q2",
    "questionText": "What is $12 \\\\times 3$?",
    "questionType": "multiple-choice",
    "options": ["24", "30", "36", "42"],
    "correctAnswer": "36",
    "points": 1,
    "explanation": "Multiply 12 by 3",
    "standard": "${standard || '7.NS.A.1'}"
  }
]

**Question Types:**
Choose the most appropriate type for each question:
- "short-answer" - For numeric answers, fractions, or short text responses
- "multiple-choice" - For questions with 4 options
  * **CRITICAL**: If questionType is "multiple-choice", you MUST include an "options" array with EXACTLY 4 choices
  * The "correctAnswer" should be the actual answer value (NOT the letter A/B/C/D)
  * Make wrong answers plausible (common mistakes, close values, similar operations)
  * Order options logically when possible (e.g., smallest to largest for numbers)
  * Example: {"questionType": "multiple-choice", "options": ["18", "24", "36", "42"], "correctAnswer": "36"}
- "fraction" - For fraction-specific answers (include "acceptEquivalentFractions": true)
- "fill-blank" - For answers with units (include "blankFormat")
- "horizontal-ordering" - For ordering numbers/items horizontally (include "orderingItems" array with 5 items to order)

**LaTeX Format Examples:**
- Fractions: "Calculate $\\\\frac{3}{4} + \\\\frac{1}{2}$"
- Long division: "Solve: $$\\\\longdiv{12}{144}$$" (for 144 ÷ 12)
- Stacked addition: "$$\\\\begin{array}{r} 456 \\\\\\\\ + 123 \\\\\\\\ \\\\hline \\\\end{array}$$"
- Multiplication symbol: "Calculate $3 \\\\times 4$"

${exampleQuestion ? `**Remember**: Follow the example question format EXACTLY. If the example uses "Calculate:", use "Calculate:". If it uses stacked format, use stacked format. If it has specific number ranges or operations, match those patterns.` : ''}

Now generate ${numberOfQuestions} template questions for the goal above. Return ONLY the JSON array.`
}

/**
 * Parse AI response and extract questions
 */
function parseAIResponse(response: string, expectedCount: number): TemplateQuestion[] {
  try {
    // Remove markdown code fences if present
    let cleanResponse = response
      .replace(/```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    // Try to find JSON array in response
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response')
    }

    let jsonString = jsonMatch[0]

    // Fix common AI mistakes: Remove LaTeX math delimiters from answer fields
    // The AI sometimes wraps answers in $...$ which causes JSON parsing errors with \$
    // Replace patterns like: "correctAnswer": "$7 \\times h$" -> "correctAnswer": "7 × h"
    jsonString = jsonString.replace(/"correctAnswer":\s*"\$([^"]+)\$"/g, (match, content) => {
      // Remove LaTeX commands and replace with plain text
      const plainAnswer = content
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\cdot/g, '·')
        .replace(/\\\$/g, '$')
      return `"correctAnswer": "${plainAnswer}"`
    })

    // Also fix acceptableAnswers arrays
    jsonString = jsonString.replace(
      /"acceptableAnswers":\s*\[([^\]]+)\]/g,
      (match, arrayContent) => {
        // Fix each element in the array
        const fixedArray = arrayContent.replace(
          /"\$([^"]+)\$"/g,
          (itemMatch: string, content: string) => {
            const plainAnswer = content
              .replace(/\\times/g, '×')
              .replace(/\\div/g, '÷')
              .replace(/\\cdot/g, '·')
              .replace(/\\\$/g, '$')
            return `"${plainAnswer}"`
          },
        )
        return `"acceptableAnswers": [${fixedArray}]`
      },
    )
    let parsed: any

    // First, try to parse without modification (AI should already have correct escaping)
    try {
      parsed = JSON.parse(jsonString)
    } catch (firstError) {
      // If that fails, the response might be truncated or malformed
      console.warn('First parse attempt failed, checking for truncation...')

      // Check if the JSON is truncated (doesn't end with ] properly)
      const trimmed = jsonString.trim()
      if (!trimmed.endsWith(']')) {
        console.warn('Response appears truncated, attempting to recover...')
        // Try to close the JSON array properly
        // Find the last complete object by looking for the last }
        const lastCompleteObject = trimmed.lastIndexOf('}')
        if (lastCompleteObject !== -1) {
          // Close any open strings or objects and add closing bracket
          jsonString = trimmed.substring(0, lastCompleteObject + 1) + ']'
        }
      }

      // Try parsing again
      try {
        parsed = JSON.parse(jsonString)
      } catch (secondError) {
        // Last resort: Try with escape replacement BUT only for unescaped backslashes
        // This regex only replaces single backslashes not followed by another backslash
        console.warn('Second parse attempt failed, trying selective escape fix...')
        jsonString = jsonString.replace(/\\(?!\\)/g, '\\\\')
        parsed = JSON.parse(jsonString)
      }
    }

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array')
    }

    if (parsed.length === 0) {
      throw new Error('No questions found in AI response')
    }

    if (parsed.length !== expectedCount) {
      console.warn(
        `Expected ${expectedCount} questions but got ${parsed.length}. Using what we have.`,
      )
    }

    // Validate and normalize questions
    const questions: TemplateQuestion[] = parsed.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      questionText: ensureLatexWrapped(q.questionText || ''),
      questionType: q.questionType || 'short-answer',
      correctAnswer: q.correctAnswer || '',
      acceptableAnswers: q.acceptableAnswers || [],
      points: q.points || 1,
      explanation: ensureLatexWrapped(q.explanation || ''),
      standard: q.standard || '',
      // Include optional fields if present
      ...(q.options && { options: q.options }),
      ...(q.acceptEquivalentFractions !== undefined && {
        acceptEquivalentFractions: q.acceptEquivalentFractions,
      }),
      ...(q.matchingPairs && { matchingPairs: q.matchingPairs }),
      ...(q.itemsToRank && { itemsToRank: q.itemsToRank }),
      ...(q.correctOrder && { correctOrder: q.correctOrder }),
      ...(q.orderingItems && { orderingItems: q.orderingItems }),
      ...(q.correctHorizontalOrder && { correctHorizontalOrder: q.correctHorizontalOrder }),
      ...(q.blankFormat && { blankFormat: q.blankFormat }),
    }))

    // Ensure we have at least some questions
    if (questions.length === 0) {
      throw new Error('No valid questions parsed from AI response')
    }

    return questions
  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.error('Raw response:', response)
    throw new Error(
      `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Generate variations of existing template questions for new assessments
 */
export async function generateQuestionVariations(
  templateQuestions: TemplateQuestion[],
  goalText: string,
  numberOfVariations: number = 1,
): Promise<TemplateQuestion[][]> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY not configured. Please add it to your .env file.')
    }

    const prompt = buildVariationPrompt(templateQuestions, goalText, numberOfVariations)

    const generateWithGemini = httpsCallable<
      { model: string; prompt: string; apiKey: string; temperature?: number; maxTokens?: number },
      { success: boolean; content?: string; response?: string; error?: string }
    >(functions, 'generateWithGemini')

    console.log(`🤖 Generating ${numberOfVariations} variations of template questions...`)
    const result = await generateWithGemini({
      model: getAIModel('TEMPLATE_QUESTIONS'),
      prompt,
      apiKey,
      temperature: 0.7,
      maxTokens: AI_TOKEN_LIMITS.MEDIUM,
    })

    const data = result.data
    if (!data.success || !data.content) {
      throw new Error(data.error || 'Failed to generate variations')
    }

    const aiResponse = data.content
    console.log('AI Response for variations:', aiResponse)

    // Parse response - expecting array of arrays
    const variations = parseVariationsResponse(
      aiResponse,
      numberOfVariations,
      templateQuestions.length,
    )

    return variations
  } catch (error) {
    console.error('Error generating question variations:', error)
    throw new Error(
      `Failed to generate variations: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Build prompt for generating variations
 */
function buildVariationPrompt(
  templateQuestions: TemplateQuestion[],
  goalText: string,
  numberOfVariations: number,
): string {
  return `You are an expert math educator creating variations of template questions for IEP assessments.

**IMPORTANT FORMATTING INSTRUCTIONS:**
1. Use **double backslashes** for all LaTeX commands (e.g., \\\\frac{1}{3})
2. For dollar amounts: $\\$18.25$
3. For stacked problems: \\\\begin{array}{r} ... \\\\end{array}

**Goal:** ${goalText}

**Template Questions:**
${JSON.stringify(templateQuestions, null, 2)}

**Your Task:**
Create ${numberOfVariations} new sets of questions. Each set should have ${templateQuestions.length} questions that are VARIATIONS of the template questions above.

**Requirements:**
1. Keep the same question TYPE and STRUCTURE as the template
2. Change the NUMBERS, CONTEXTS, and SCENARIOS
3. Maintain the same difficulty level
4. Ensure variety across all variations (no repetitive patterns)
5. Each variation set should be completely independent

**Output Format:**
Return a JSON array of ${numberOfVariations} arrays (one per variation):

[
  [
    { "id": "q1", "questionText": "...", "questionType": "short-answer", "correctAnswer": "...", "points": 1, ... },
    { "id": "q2", ... },
    ...
  ],
  [
    { "id": "q1", "questionText": "...", "questionType": "short-answer", "correctAnswer": "...", "points": 1, ... },
    { "id": "q2", ... },
    ...
  ]
]

Return ONLY the JSON array (no additional text).`
}

/**
 * Parse variations response
 */
function parseVariationsResponse(
  response: string,
  expectedVariations: number,
  questionsPerVariation: number,
): TemplateQuestion[][] {
  try {
    // Remove markdown code fences if present
    let cleanResponse = response
      .replace(/```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response')
    }

    let jsonString = jsonMatch[0]
    let parsed: any

    // First, try to parse without modification (AI should already have correct escaping)
    try {
      parsed = JSON.parse(jsonString)
    } catch (firstError) {
      // If that fails, the response might be truncated or malformed
      console.warn('First parse attempt failed, checking for truncation...')

      // Check if the JSON is truncated
      const trimmed = jsonString.trim()
      if (!trimmed.endsWith(']')) {
        console.warn('Response appears truncated, attempting to recover...')
        const lastCompleteObject = trimmed.lastIndexOf('}')
        if (lastCompleteObject !== -1) {
          // Try to close nested arrays properly
          const openBrackets = (trimmed.match(/\[/g) || []).length
          const closeBrackets = (trimmed.match(/\]/g) || []).length
          jsonString =
            trimmed.substring(0, lastCompleteObject + 1) +
            ']'.repeat(openBrackets - closeBrackets + 1)
        }
      }

      // Try parsing again
      try {
        parsed = JSON.parse(jsonString)
      } catch (secondError) {
        // Last resort: selective escape replacement
        console.warn('Second parse attempt failed, trying selective escape fix...')
        jsonString = jsonString.replace(/\\(?!\\)/g, '\\\\')
        parsed = JSON.parse(jsonString)
      }
    }

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array')
    }

    // Normalize variations
    const variations: TemplateQuestion[][] = parsed.map((variation: any[], varIndex: number) => {
      if (!Array.isArray(variation)) {
        throw new Error(`Variation ${varIndex + 1} is not an array`)
      }

      return variation.map((q: any, qIndex: number) => ({
        id: q.id || `q${qIndex + 1}`,
        questionText: q.questionText || '',
        questionType: q.questionType || 'short-answer',
        correctAnswer: q.correctAnswer || '',
        acceptableAnswers: q.acceptableAnswers || [],
        points: q.points || 1,
        explanation: q.explanation || '',
        standard: q.standard || '',
        ...(q.options && { options: q.options }),
        ...(q.acceptEquivalentFractions !== undefined && {
          acceptEquivalentFractions: q.acceptEquivalentFractions,
        }),
        ...(q.matchingPairs && { matchingPairs: q.matchingPairs }),
        ...(q.itemsToRank && { itemsToRank: q.itemsToRank }),
        ...(q.correctOrder && { correctOrder: q.correctOrder }),
        ...(q.orderingItems && { orderingItems: q.orderingItems }),
        ...(q.correctHorizontalOrder && { correctHorizontalOrder: q.correctHorizontalOrder }),
        ...(q.blankFormat && { blankFormat: q.blankFormat }),
      }))
    })

    // Ensure we have at least some variations
    if (variations.length === 0) {
      throw new Error('No valid variations parsed from AI response')
    }

    return variations
  } catch (error) {
    console.error('Error parsing variations response:', error)
    console.error('Raw response:', response)
    throw new Error(
      `Failed to parse variations: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
