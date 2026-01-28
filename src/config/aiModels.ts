/**
 * AI Model Configuration
 *
 * Centralized configuration for Gemini AI models used throughout the application.
 * Update this file when models are deprecated or new versions are released.
 *
 * Model Lifecycle Info (as of Jan 2026):
 * - gemini-2.0-flash-exp: DEPRECATED (removed)
 * - gemini-2.0-flash: Retiring March 2026
 * - gemini-2.5-flash: Current stable production model ✅
 * - gemini-2.5-flash-lite: Cost-efficient option
 * - gemini-3-flash-preview: Bleeding edge preview
 */

export const AI_MODELS = {
  /**
   * Default model for all AI operations
   * Currently: gemini-2.5-flash (stable, production-ready)
   */
  DEFAULT: 'gemini-2.5-flash',

  /**
   * Model for template question generation
   * Used in: templateQuestionGenerator.ts
   */
  TEMPLATE_QUESTIONS: 'gemini-2.5-flash',

  /**
   * Model for goal question generation
   * Used in: goalQuestionGenerator.ts
   */
  GOAL_QUESTIONS: 'gemini-2.5-flash',

  /**
   * Model for AI question generation
   * Used in: aiQuestionGenerator.ts
   */
  AI_QUESTIONS: 'gemini-2.5-flash',

  /**
   * Model for template draft generation
   * Used in: templateDraftGenerator.ts
   */
  TEMPLATE_DRAFTS: 'gemini-2.5-flash',

  /**
   * Alternative: Cost-efficient model for high-volume operations
   * Uncomment to use lite version (near-zero cost)
   */
  // DEFAULT: 'gemini-2.5-flash-lite',

  /**
   * Alternative: Bleeding edge preview for better performance
   * Uncomment to use preview version (faster, smarter)
   */
  // DEFAULT: 'gemini-3-flash-preview',
} as const

/**
 * Get the appropriate model for a specific use case
 */
export function getAIModel(useCase: keyof typeof AI_MODELS = 'DEFAULT'): string {
  return AI_MODELS[useCase] || AI_MODELS.DEFAULT
}

/**
 * Temperature settings for different AI tasks
 */
export const AI_TEMPERATURES = {
  /** More deterministic, better for structured outputs */
  LOW: 0.3,

  /** Balanced creativity and consistency */
  MEDIUM: 0.6,

  /** More creative, varied outputs */
  HIGH: 0.9,
} as const

/**
 * Token limits for different tasks
 */
export const AI_TOKEN_LIMITS = {
  /** Short responses (single question) */
  SHORT: 1000,

  /** Medium responses (multiple questions) */
  MEDIUM: 4000,

  /** Long responses (detailed templates) */
  LONG: 8000,
} as const
