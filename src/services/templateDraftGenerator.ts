/**
 * AI Template Draft Generator
 * 
 * This service uses AI to analyze goal text and generate a draft template
 * with structured fields (numberOfSteps, questionTypes, contextTypes, etc.)
 */

import type { GoalTemplate } from '@/types/iep'

export interface TemplateDraft {
  // Basic info
  name: string
  subject: 'math' | 'ela' | 'other'
  topic: string
  description: string
  
  // Example question
  exampleQuestion: string
  exampleAnswer: string
  exampleExplanation?: string
  
  // NEW: Student-facing directions
  directions?: string
  
  // NEW: Word problem frame type
  problemFrameType?: 'combine' | 'change' | 'compare' | 'missing-part' | 'equal-groups' | 'comparison' | 'multi-step' | 'other'
  
  // Structured fields
  problemStructure: {
    numberOfSteps?: 1 | 2 | 3 | 4
    questionTypes?: string[]
    contextTypes?: string[]
    numberRanges?: {
      question1?: string
      question2?: string
      question3?: string
      question4?: string
      question5?: string
    }
    forbiddenPatterns?: string[]
  }
  
  allowedOperations?: ('addition' | 'subtraction' | 'multiplication' | 'division')[]
  customAIPrompt?: string
}

/**
 * Generate a template draft from goal text using AI
 * Returns an array of templates if the goal requires multiple question types
 */
export async function generateTemplateDraft(
  goalText: string,
  goalTitle?: string,
  areaOfNeed?: string,
): Promise<TemplateDraft> {
  const drafts = await generateTemplateDrafts(goalText, goalTitle, areaOfNeed)
  return drafts[0] // Return first draft for backwards compatibility
}

/**
 * Generate template drafts from goal text using AI
 * Detects if goal requires multiple question types (e.g., "whole numbers, fractions, OR decimals")
 * and returns multiple templates accordingly
 */
export async function generateTemplateDrafts(
  goalText: string,
  goalTitle?: string,
  areaOfNeed?: string,
): Promise<TemplateDraft[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not configured')
  }

  const prompt = `You are an expert IEP goal and assessment designer. Analyze this IEP goal and generate structured template(s) for creating assessment questions.

IEP GOAL:
Title: ${goalTitle || 'Not provided'}
Area of Need: ${areaOfNeed || 'Not provided'}
Goal Text: ${goalText}

YOUR TASK:

**CRITICAL**: First, detect if this goal requires MULTIPLE question types (e.g., "whole numbers, fractions, OR decimals", "addition AND subtraction", "reading comprehension AND vocabulary").

If the goal has "OR" or "AND" conditions requiring different question types:
- Generate a SEPARATE template for EACH type
- Return an array of templates

If the goal requires only ONE type:
- Generate a single template
- Return an array with one template

For EACH template, analyze and include:

1. **Problem Type Identification**
   - What type of math/skill problem is this? (e.g., "multi-step word problem with whole numbers", "multi-step word problem with fractions")
   - Subject: math, ela, or other?
   - Specific topic
   - **Variant**: If this is one of multiple types, specify which (e.g., "whole-numbers", "fractions", "decimals")

2. **Example Question**
   - Create ONE example question for THIS specific type
   - Include a correct answer
   - Add a brief explanation

3. **Problem Structure**
   - Number of steps required to solve (1-4)
   - Question type variations (e.g., for percentages: "find-percent", "find-part", "find-whole")
   - Context types that fit this problem - **LIST AT LEAST 8-10 DIFFERENT CONTEXTS** for maximum variety (e.g., "quiz", "basketball", "pizza", "homework", "spelling-test", "soccer-goals", "cookie-sales", "video-game-levels", "book-pages-read", "days-attended")

4. **Number Variation Strategy**
   - Suggest different number ranges for questions 1-5 (appropriate for THIS type)
   - List any number patterns that should be FORBIDDEN (too common/repetitive)

5. **Operations**
   - Which math operations are allowed? (addition, subtraction, multiplication, division)

6. **Custom AI Instructions**
   - Brief instructions on how to vary this question type while keeping the structure
   - **IMPORTANT**: Specify that this template is ONLY for this specific type (e.g., "ONLY use whole numbers, never fractions or decimals")

7. **Student Directions** (NEW)
   - Create step-by-step directions for students on HOW to solve this type of problem
   - Should be 3-5 clear steps
   - Written in student-friendly language
   - Example: "1. Read the problem carefully and identify what you need to find. 2. Multiply the cost of each item by the quantity. 3. Add all the costs together. 4. Subtract from the amount paid to find the change."

8. **Word Problem Frame Type** (NEW)
   - Identify which story structure/frame this problem follows:
     * "combine" = Two or more groups put together to find total (part + part = total)
     * "change" = Start with amount, then change happens (start ± change = final)
     * "compare" = Compare two amounts to find difference (bigger − smaller = difference)
     * "missing-part" = Know total and one part, find other part (total − known = missing)
     * "equal-groups" = Multiple equal groups (groups × size = total)
     * "multi-step" = Requires multiple operations/frames
     * "other" = Doesn't fit standard frames
   - This helps students identify the story structure and choose the right solving strategy

Return your analysis as a JSON object with this exact structure:

{
  "templates": [
    {
      "name": "Short template name including variant (e.g., 'Multi-step Word Problem - Whole Numbers')",
      "subject": "math" | "ela" | "other",
      "topic": "Specific topic (e.g., 'multi-step word problems')",
      "variant": "The specific type variant (e.g., 'whole-numbers', 'fractions', 'decimals') or null",
      "description": "Brief description including which variant this template is for",
      "exampleQuestion": "The example question text for THIS variant",
      "exampleAnswer": "The correct answer",
      "exampleExplanation": "Brief explanation of solution",
      "directions": "Step-by-step student directions (3-5 steps) on HOW to solve this type of problem",
      "problemFrameType": "combine" | "change" | "compare" | "missing-part" | "equal-groups" | "multi-step" | "other",
      "problemStructure": {
        "numberOfSteps": 1 | 2 | 3 | 4,
        "questionTypes": ["array", "of", "question-type-variations"],
        "contextTypes": ["array", "of", "real-world-contexts"],
        "numberRanges": {
          "question1": "e.g., '25-50 whole numbers' or '1/2 to 3/4'",
          "question2": "different range",
          "question3": "different range",
          "question4": "different range",
          "question5": "different range"
        },
        "forbiddenPatterns": ["array", "of", "overused-patterns"]
      },
      "allowedOperations": ["array", "of", "operations"],
      "customAIPrompt": "Detailed instructions emphasizing this is ONLY for [variant]. Never use other number types."
    }
  ]
}

EXAMPLE for goal "solve problems with whole numbers, fractions, OR decimals":
{
  "templates": [
    {
      "name": "Multi-step Word Problem - Whole Numbers",
      "variant": "whole-numbers",
      "subject": "math",
      "topic": "multi-step word problems",
      "description": "Multi-step word problems using only whole numbers",
      "exampleQuestion": "Sarah bought 3 notebooks for $2 each and 5 pens for $1 each. How much did she spend in total?",
      "exampleAnswer": "$11",
      "exampleExplanation": "3 × $2 = $6, 5 × $1 = $5, $6 + $5 = $11",
      "directions": "How to solve multi-step money problems:\n1. Read the problem carefully and identify what you need to find.\n2. For each item, multiply the cost by the quantity.\n3. Add all the costs together to find the total.\n4. Show your work for each step.",
      "problemStructure": {
        "numberOfSteps": 2,
        "questionTypes": ["multi-step-money", "multi-step-items"],
        "contextTypes": ["shopping", "classroom-supplies", "party-planning", "sports-equipment", "craft-supplies", "grocery-shopping", "toy-store", "bookstore", "electronics-store", "pet-supplies"],
        "numberRanges": {
          "question1": "whole numbers 1-10, prices $1-$5",
          "question2": "whole numbers 5-15, prices $2-$8",
          "question3": "whole numbers 10-25, prices $3-$10",
          "question4": "whole numbers 15-30, prices $5-$15",
          "question5": "whole numbers 20-50, prices $8-$20"
        },
        "forbiddenPatterns": ["$25 saved", "$65 total", "washing cars"]
      },
      "allowedOperations": ["addition", "subtraction", "multiplication"],
      "customAIPrompt": "ONLY use whole numbers (integers). NEVER use fractions or decimals. Vary the items purchased and prices, but keep all numbers as whole numbers. Change contexts between shopping, school supplies, party planning, etc."
    },
    {
      "name": "Multi-step Word Problem - Fractions",
      "variant": "fractions",
      "subject": "math",
      "topic": "multi-step word problems",
      "description": "Multi-step word problems using fractions",
      "exampleQuestion": "A recipe calls for 2 1/2 cups of flour. If you want to make half the recipe, how much flour do you need?",
      "exampleAnswer": "1 1/4 cups",
      "directions": "How to solve fraction word problems:\n1. Read the problem and identify the fractions involved.\n2. Determine what operation you need (multiply, divide, add, or subtract).\n3. Find common denominators if adding or subtracting.\n4. Simplify your answer to lowest terms.",
      "customAIPrompt": "ONLY use fractions. NEVER use whole numbers alone or decimals. Keep fractions simple (halves, quarters, thirds, eighths). Use recipe, measurement, or sharing contexts."
    },
    {
      "name": "Multi-step Word Problem - Decimals",
      "variant": "decimals",
      "subject": "math",
      "topic": "multi-step word problems",
      "description": "Multi-step word problems using decimals",
      "exampleQuestion": "Gas costs $3.45 per gallon. If you pump 8.5 gallons, how much will you pay?",
      "exampleAnswer": "$29.33",
      "directions": "How to solve decimal money problems:\n1. Read the problem and identify the decimal numbers.\n2. Line up the decimal points when adding or subtracting.\n3. When multiplying, count total decimal places in your answer.\n4. Round money answers to two decimal places (cents).",
      "customAIPrompt": "ONLY use decimals (money, measurements). NEVER use whole numbers alone or fractions. Use realistic decimal values for money (e.g., $3.45, $12.99) and measurements (e.g., 8.5 gallons, 12.3 pounds)."
    }
  ]
}

IMPORTANT:
- Be specific and detailed
- Create a SEPARATE template for each "OR" condition in the goal
- Each template's customAIPrompt should FORBID the other number types
- Number ranges should be appropriate for each variant
- Return ONLY the JSON object, no other text.`

  try {
    // Use Firebase Function to call Gemini
    const { getFunctions, httpsCallable } = await import('firebase/functions')
    const { app } = await import('@/firebase/config')
    const functions = getFunctions(app, 'us-west1')
    const generateWithGemini = httpsCallable(functions, 'generateWithGemini')

    const result = await generateWithGemini({
      model: 'gemini-2.0-flash',
      prompt,
      temperature: 0.4,
      maxTokens: 3000, // Increased for multiple templates
      apiKey,
    })

    const data = result.data as any

    if (!data.success || !data.content) {
      throw new Error('AI generation failed')
    }

    // Parse the JSON response
    const content = data.content
    console.log('📄 Raw AI response (first 500 chars):', content.substring(0, 500))
    
    // Extract JSON (may be wrapped in markdown)
    let jsonText = content.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    console.log('🔍 Extracted JSON (first 500 chars):', jsonText.substring(0, 500))

    const parsed = JSON.parse(jsonText)
    
    // Handle both old format (single template) and new format (array of templates)
    let templates: any[]
    if (parsed.templates && Array.isArray(parsed.templates)) {
      templates = parsed.templates
      console.log(`✅ Parsed ${templates.length} template(s) from AI response`)
    } else {
      // Old format - single template object
      templates = [parsed]
      console.log('✅ Parsed single template from AI response (old format)')
    }

    // Convert each template to TemplateDraft format
    const drafts: TemplateDraft[] = templates.map((t: any) => ({
      name: t.name,
      subject: t.subject,
      topic: t.topic,
      description: t.description || '',
      exampleQuestion: t.exampleQuestion,
      exampleAnswer: t.exampleAnswer,
      exampleExplanation: t.exampleExplanation,
      problemStructure: {
        numberOfSteps: t.problemStructure?.numberOfSteps,
        questionTypes: t.problemStructure?.questionTypes || [],
        contextTypes: t.problemStructure?.contextTypes || [],
        numberRanges: t.problemStructure?.numberRanges || {},
        forbiddenPatterns: t.problemStructure?.forbiddenPatterns || [],
      },
      allowedOperations: t.allowedOperations || [],
      customAIPrompt: t.customAIPrompt || '',
    }))

    // Validate required fields for each draft
    for (const draft of drafts) {
      if (!draft.name || !draft.exampleQuestion || !draft.exampleAnswer) {
        throw new Error('AI response missing required fields')
      }
    }

    return drafts
  } catch (error) {
    console.error('Template draft generation error:', error)
    throw new Error(
      `Failed to generate template draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
