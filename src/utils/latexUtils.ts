import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Renders LaTeX expressions in text content
 * Supports both inline ($...$) and display ($$...$$) math
 */
export function renderLatexInText(text: string): string {
  if (!text) return ''
  
  try {
    // Replace display math ($$...$$) first to avoid conflicts
    let result = text.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
      try {
        return katex.renderToString(latex.trim(), { 
          displayMode: true, 
          throwOnError: false,
          strict: false
        })
      } catch (error) {
        console.warn('LaTeX display math render error:', error)
        return match // Return original if rendering fails
      }
    })
    
    // Replace inline math ($...$)
    result = result.replace(/\$([^$]+)\$/g, (match, latex) => {
      try {
        return katex.renderToString(latex.trim(), { 
          displayMode: false, 
          throwOnError: false,
          strict: false
        })
      } catch (error) {
        console.warn('LaTeX inline math render error:', error)
        return match // Return original if rendering fails
      }
    })
    
    return result
  } catch (error) {
    console.warn('LaTeX rendering error:', error)
    return text // Return original text if any error occurs
  }
}

/**
 * Checks if text contains LaTeX expressions
 */
export function hasLatexExpressions(text: string): boolean {
  return /\$[^$]+\$/.test(text) || /\$\$[^$]+\$\$/.test(text)
}

/**
 * Extracts LaTeX expressions from text
 */
export function extractLatexExpressions(text: string): string[] {
  const expressions: string[] = []
  
  // Extract display math
  const displayMatches = text.match(/\$\$([^$]+)\$\$/g)
  if (displayMatches) {
    expressions.push(...displayMatches)
  }
  
  // Extract inline math
  const inlineMatches = text.match(/\$([^$]+)\$/g)
  if (inlineMatches) {
    expressions.push(...inlineMatches)
  }
  
  return expressions
}

/**
 * Validates LaTeX expression syntax
 */
export function validateLatex(expression: string): { isValid: boolean; error?: string } {
  try {
    katex.renderToString(expression, { throwOnError: true })
    return { isValid: true }
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown LaTeX error'
    }
  }
}


