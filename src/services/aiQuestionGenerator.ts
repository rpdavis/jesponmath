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
  model: 'gemini-2.0-flash', // Best for JSON & Math reasoning
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
  templateStructure?: any, // NEW: Full template with problemStructure
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

  // Build the prompt with template structure
  const prompt = buildPrompt(
    goal,
    subject,
    questionNumber,
    templateReference,
    finalConfig.difficulty,
    allowedOperations,
    customVariationInstructions,
    templateStructure, // Pass the full template
  )

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
  templateStructure?: any, // NEW: Pass the full template with problemStructure
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

  // Build variety instructions from template's problemStructure
  let varietyInstructions = `
⚠️ THIS IS QUESTION #${questionNumber} - Use student name: ${studentName}

🚨 CRITICAL: ENSURE VARIETY FOR QUESTION #${questionNumber}:
`

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
- Vary the numbers significantly from the template
- Change the context/scenario
- Use different items, activities, or situations
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
   - Keep the same number of steps
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

  // If we have a template, PUT IT FIRST and suppress conflicting variety instructions
  const promptStart = templateReference
    ? `🚨🚨🚨 CRITICAL INSTRUCTION - READ THIS FIRST 🚨🚨🚨

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

CRITICAL: ENSURE VARIETY - Question #${questionNumber}
${questionNumber === 1 ? '- Use the first student name from this list: [Rose, Maria, Jesus, Aisha, Jaime, Kenji, Samantha, Aaliyah, Caiden, Mateo, Jayden, Aubree, Lucas, Sofia, Emma, Liam, Noah, Zara, Andre, Kai]' : ''}
${questionNumber === 2 ? '- Use the second student name from this list: [Antoinette, Jamal, Israel, Gus, Victor, Diego, Liliana, Mika, Annabella, Carlos, Kevin, EJ, Kaylani, Mia, Elijah, Amara, Adrian, Leah, Dante, Nadia]' : ''}
${questionNumber === 3 ? '- Use the third student name from this list: [Lexee, Fatima, Kwame, Jose, Josue, Zyphier, Daniel, Darnell, Michael, Esperanza, Aubrey, Carter, Matteo, Grace, Isaiah, Layla, Marco, Ruby, Ben, Zoe]' : ''}
${questionNumber === 4 ? '- Use the fourth student name from this list: [Alonzo, Omar, Mikah, Xiomara, Olivia, Raj, Marcos, Lakisha, Steven, Hiroshi, Iker, William, Jazmine, Aria, Ethan, Camila, Rashid, Lily, Marcus, Yuki]' : ''}
${questionNumber === 5 ? '- Use the fifth student name from this list: [Dylan, Amara, Lyra, Hassan, Maya, Rosa, Tucker, Chen, Elizabeth, Isaiah, Maria, Amy, Omar, Ava, Jackson, Sofia, Ahmed, Chloe, Jordan, Keisha]' : ''}

REMEMBER: You are creating a VARIATION of the template shown above. Change names and numbers, but DO NOT change the problem type or structure!`
    : `Generate an assessment question based on this IEP goal:

Goal Title: ${goal.goalTitle}
Goal Text: ${goal.goalText}
Area of Need: ${goal.areaOfNeed}
Subject: ${subject}
Grade Level: ${goal.gradeLevel || 'Not specified'}
Question Number: ${questionNumber}
Assessment Method: ${assessmentMethod.toUpperCase()}

${assessmentMethodGuidance}
${varietyInstructions}`

  return `${promptStart}
${operationConstraints}

Requirements:
1. The question must directly assess the skill described in the goal
2. For math: Include real-world scenarios when appropriate, ask students to show work
3. For ELA: Create age-appropriate reading/writing prompts
4. Make the question clear and appropriate for the student's grade level
5. Provide a complete answer with explanation
6. Consider the assessment method when deciding if photo uploads are needed
7. ⚠️ CRITICAL: Each question must be UNIQUE - vary names, numbers, scenarios, and final answers

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
- CRITICAL: For all mathematical equations, expressions, and fractions, use LaTeX/KaTeX formatting.
- Use $...$ for inline math (e.g., $x = 5$) and $$...$$ for standalone equations.
- **IMPORTANT**: When using LaTeX commands in JSON, you MUST use DOUBLE BACKSLASHES.
- Example: For fractions, use "$\\\\frac{1}{2}$" (double backslash)
- Example: For square roots, use "$\\\\sqrt{25}$" (double backslash)
- This is because JSON strings treat single backslash as an escape character.

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
  "question": "Maria has $35.50. She buys a book for $12.75. How much money does she have left?",
  "answer": "22.75",
  "answerPrefix": "$",
  "answerSuffix": "",
  "alternativeAnswers": ["22.75", "$22.75", "22.8", "$22.8"],
  "explanation": "Subtract the cost from the total: $35.50 - $12.75 = $22.75",
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
