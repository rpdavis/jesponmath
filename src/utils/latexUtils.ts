import katex from 'katex'
import 'katex/dist/katex.min.css'

type Segment = { type: 'math'; raw: string; display: boolean } | { type: 'text'; raw: string }

/**
 * Cache for compiled TikZ diagrams
 * Maps TikZ code to image URLs to avoid recompilation
 */
const tikzCache = new Map<string, string>()

/**
 * Custom KaTeX macros for common math notation
 * These make it easier to type complex math expressions
 */
const KATEX_MACROS = {
  // Long division: \longdiv{divisor}{dividend}
  // Example: \longdiv{45}{345} produces 45)‾345
  // Groups divisor properly to handle multi-digit numbers
  '\\longdiv': '{#1}\\kern0.1em\\overline{)\\kern0.15em#2}',

  // Alternative long division (simpler): \ldiv{divisor}{dividend}
  '\\ldiv': '{#1}\\overline{)#2}',

  // Vertical addition/subtraction alignment helper
  '\\stack': '\\begin{array}{r}#1\\end{array}',
}

/**
 * Ensure LaTeX expressions are wrapped in $ or $$
 * This function wraps naked LaTeX commands with dollar signs for proper rendering
 * IMPORTANT: Skips wrapping if already wrapped to prevent double-wrapping
 */
export function ensureLatexWrapped(text: string): string {
  if (!text) return text

  // Don't process if text already has dollar-wrapped math that looks correct
  // This prevents double-wrapping already-formatted content
  const hasDollarMath = /\$[^$]+\$/.test(text)
  const hasDoubleDollarMath = /\$\$[^$]+\$\$/.test(text)

  // If already has wrapped math, be conservative and don't add more wrappers
  // The AI should be generating properly wrapped content
  if (hasDollarMath || hasDoubleDollarMath) {
    return text
  }

  let result = text

  // Pattern 1: \\frac{}{} or \frac{}{} - most common (handles escaped backslashes from JSON)
  result = result.replace(/([^$\\])(\\{1,2}frac\{[^}]+\}\{[^}]+\})([^$])/g, '$1$$$2$$$3')

  // Pattern 2: \\sqrt{} or \sqrt{} (with optional power like \sqrt[3]{})
  result = result.replace(/([^$\\])(\\{1,2}sqrt(?:\[[^\]]+\])?\{[^}]+\})([^$])/g, '$1$$$2$$$3')

  // Pattern 3: \\begin{array}...\\end{array} (multi-line, handles escaped backslashes)
  result = result.replace(
    /([^$])(\\{1,2}begin\{array\}[^]*?\\{1,2}end\{array\})([^$])/gs,
    '$1$$$$$$2$$$$$$3',
  )

  // Pattern 4: Other common LaTeX commands with braces (\\overline{}, \\underline{}, etc.)
  const singleArgCommands = ['overline', 'underline', 'phantom', 'longdiv', 'ldiv', 'text']
  singleArgCommands.forEach((cmd) => {
    const regex = new RegExp(`([^$\\\\])(\\\\{1,2}${cmd}\\{[^}]+\\})([^$])`, 'g')
    result = result.replace(regex, '$1$$$2$$$3')
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
    'gamma',
    'delta',
    'epsilon',
    'lambda',
    'mu',
    'sigma',
    'omega',
    'infty',
    'cdot',
    'leq',
    'geq',
    'neq',
    'approx',
    'equiv',
    'sum',
    'prod',
    'int',
    'partial',
    'nabla',
  ]
  standaloneCommands.forEach((cmd) => {
    // Match command not preceded by $ or \ and not followed by letter or $
    const regex = new RegExp(`([^$\\\\])(\\\\{1,2}${cmd})(?![a-zA-Z])([^$])`, 'g')
    result = result.replace(regex, '$1$$$2$$$3')
  })

  return result
}

/**
 * Splits text into math and text segments
 */
function splitMath(text: string): Segment[] {
  const segs: Segment[] = []
  let i = 0
  let buf = ''

  const pushText = () => {
    if (buf) segs.push({ type: 'text', raw: buf })
    buf = ''
  }

  const readMath = (display: boolean): { raw: string; endIndex: number } | null => {
    // We are currently positioned *after* the opening delimiter:
    // - for inline: after '$'
    // - for display: after '$$'
    const start = i
    let braceDepth = 0
    let escaped = false

    while (i < text.length) {
      const ch = text[i]

      if (escaped) {
        escaped = false
        i++
        continue
      }

      if (ch === '\\') {
        escaped = true
        i++
        continue
      }

      if (ch === '{') {
        braceDepth++
        i++
        continue
      }

      if (ch === '}') {
        if (braceDepth > 0) braceDepth--
        i++
        continue
      }

      // Delimiter check only when not escaped and not inside braces
      if (braceDepth === 0 && ch === '$') {
        if (display) {
          // Need '$$' to end display math
          if (text[i + 1] === '$') {
            const raw = text.slice(start, i)
            i += 2 // consume '$$'
            return { raw, endIndex: i }
          }
        } else {
          // Single '$' ends inline math
          const raw = text.slice(start, i)
          i += 1 // consume '$'
          return { raw, endIndex: i }
        }
      }

      i++
    }

    // If we reach here: no closing delimiter; treat as not-math
    i = start // reset to start so caller can fall back
    return null
  }

  while (i < text.length) {
    const ch = text[i]

    if (ch === '$') {
      // Potential start of math
      const isDisplay = text[i + 1] === '$'

      // Flush prior text
      pushText()

      // Consume opening delimiter
      i += isDisplay ? 2 : 1

      const math = readMath(isDisplay)
      if (math) {
        segs.push({ type: 'math', raw: math.raw, display: isDisplay })
        continue
      }

      // No closing delimiter: treat opening delimiter as literal text
      buf += isDisplay ? '$$' : '$'
      // (i was reset to start inside readMath; move past that '$' we just treated as text)
      i += isDisplay ? 2 : 1
      continue
    }

    buf += ch
    i++
  }

  pushText()
  return segs
}

/**
 * Normalizes dollar signs for KaTeX:
 * - In text mode: \$ → $ (literal dollar sign)
 * - In math mode: Leave \$ as-is - KaTeX can handle it
 */
function normalizeForKatex(text: string): Segment[] {
  return splitMath(text).map((seg) => {
    if (seg.type === 'text') {
      // text-mode: \$ should become a literal $, but leave regular $ alone
      return { ...seg, raw: seg.raw.replace(/\\\$/g, '$') }
    }
    // math-mode: DON'T touch it - let KaTeX handle \$ directly
    console.log('Math segment (unchanged):', seg.raw)
    return seg
  })
}

/**
 * Renders LaTeX expressions in text content (SYNC - backward compatible)
 * Supports both inline ($...$) and display ($$...$$) math
 * Also handles escaped dollar signs (\$) for literal dollar signs
 *
 * NOTE: This is the synchronous version for backward compatibility.
 * Does NOT support TikZ diagrams. Use renderLatexInTextAsync() for TikZ support.
 */
export function renderLatexInText(text: string): string {
  // For backward compatibility, use sync version (no TikZ)
  return renderLatexInTextSync(text)
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
    katex.renderToString(expression, {
      throwOnError: true,
      macros: KATEX_MACROS,
      trust: true,
    })
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown LaTeX error',
    }
  }
}

/**
 * Get available custom math macros
 * Returns documentation for teachers/users
 */
export function getAvailableMacros(): Array<{
  name: string
  usage: string
  example: string
  description: string
}> {
  return [
    {
      name: '\\longdiv',
      usage: '\\longdiv{divisor}{dividend}',
      example: '\\longdiv{45}{345}',
      description: 'Creates a long division symbol with proper formatting',
    },
    {
      name: '\\ldiv',
      usage: '\\ldiv{divisor}{dividend}',
      example: '\\ldiv{12}{144}',
      description: 'Simpler long division notation',
    },
    {
      name: '\\stack',
      usage: '\\stack{number1 \\\\ number2}',
      example: '\\stack{345 \\\\ +123}',
      description: 'Right-aligns numbers for vertical addition/subtraction',
    },
  ]
}

// ========================================
// TikZ Diagram Support (NEW)
// ========================================

/**
 * Extract and render TikZ diagrams to images using QuickLaTeX API
 * This runs BEFORE KaTeX processing to convert diagrams to <img> tags
 */
async function extractAndRenderTikZ(text: string): Promise<string> {
  // Find all TikZ environments
  const tikzRegex = /\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g

  let result = text
  const matches = [...text.matchAll(tikzRegex)]

  // No TikZ? Return original text (fast path)
  if (matches.length === 0) {
    return text
  }

  console.log(`🎨 Found ${matches.length} TikZ diagram(s) to render`)

  // Process each TikZ block
  for (const match of matches) {
    const tikzCode = match[0]

    try {
      // Convert TikZ to image URL (with caching)
      const imageUrl = await convertTikZToImage(tikzCode)

      // Replace TikZ code with image tag
      const imgTag = `<img src="${imageUrl}" alt="Geometric diagram" style="max-width: 500px; display: block; margin: 15px auto; border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; background: white;" class="tikz-diagram" loading="lazy">`
      result = result.replace(tikzCode, imgTag)

      console.log('✅ TikZ diagram rendered successfully')
    } catch (error) {
      console.warn('❌ Failed to render TikZ diagram:', error)
      // Replace with error message
      const errorMsg = `<div style="padding: 10px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; color: #991b1b; font-size: 0.875rem;">⚠️ TikZ diagram failed to compile. Please check your syntax.</div>`
      result = result.replace(tikzCode, errorMsg)
    }
  }

  return result
}

/**
 * Convert TikZ code to image URL using QuickLaTeX API
 * Uses caching to avoid recompiling the same diagram
 */
async function convertTikZToImage(tikzCode: string): Promise<string> {
  // Check cache first
  if (tikzCache.has(tikzCode)) {
    console.log('📦 Using cached TikZ diagram')
    return tikzCache.get(tikzCode)!
  }

  console.log('🔨 Compiling TikZ diagram with QuickLaTeX...')

  // Build complete LaTeX document
  const latexDoc = `
\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\begin{document}
${tikzCode}
\\end{document}
  `.trim()

  try {
    // Call QuickLaTeX API
    const response = await fetch('https://quicklatex.com/latex3.f', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        formula: latexDoc,
        fsize: '14px',
        fcolor: '000000',
        mode: '0',
        out: '1',
        errors: '1',
        preamble: '\\usepackage{tikz}',
      }),
    })

    const data = await response.text()
    console.log('QuickLaTeX response:', data.substring(0, 200))

    // Parse response
    // QuickLaTeX returns: status code followed by URL or error
    const lines = data.trim().split('\n')

    if (lines[0] === '0' && lines[1]) {
      // Success - lines[1] contains the image URL
      const imageUrl = lines[1].trim()

      // Cache the result
      tikzCache.set(tikzCode, imageUrl)

      console.log('✅ TikZ compiled successfully:', imageUrl)
      return imageUrl
    } else {
      // Error - lines may contain error message
      const errorMsg = lines.slice(1).join('\n')
      console.error('QuickLaTeX compilation error:', errorMsg)
      throw new Error(`TikZ compilation failed: ${errorMsg || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('QuickLaTeX API error:', error)
    throw error
  }
}

/**
 * Clear the TikZ cache (useful for testing or memory management)
 */
export function clearTikZCache(): void {
  tikzCache.clear()
  console.log('🗑️ TikZ cache cleared')
}

/**
 * Get TikZ cache statistics
 */
export function getTikZCacheStats(): { size: number; entries: number } {
  let totalSize = 0
  tikzCache.forEach((url, code) => {
    totalSize += code.length + url.length
  })
  return {
    size: totalSize,
    entries: tikzCache.size,
  }
}

// ========================================
// Enhanced Public API (Async with TikZ Support)
// ========================================

/**
 * Renders LaTeX expressions AND TikZ diagrams in text content
 *
 * Process order:
 * 1. Extract and render TikZ diagrams (async) → converts to <img> tags
 * 2. Render remaining LaTeX math with KaTeX (sync) → converts $...$ to math
 *
 * Supports:
 * - Inline math: $x^2$
 * - Display math: $$x^2$$
 * - TikZ diagrams: \begin{tikzpicture}...\end{tikzpicture}
 * - Escaped dollar signs: \$5.00
 * - Custom macros: \longdiv, \ldiv, \stack
 *
 * NOTE: This is now async due to TikZ rendering
 * Use renderLatexInTextSync() if you don't need TikZ support
 */
export async function renderLatexInTextAsync(text: string): Promise<string> {
  if (!text) return ''

  console.log('🔧 LATEX RENDERER: Starting (async with TikZ support)')

  try {
    // STEP 1: Handle TikZ diagrams (NEW - runs first)
    text = await extractAndRenderTikZ(text)

    // STEP 2: Handle regular math with KaTeX (EXISTING - unchanged)
    const segments = normalizeForKatex(text)

    const result = segments
      .map((seg) => {
        if (seg.type === 'text') {
          return seg.raw
        }

        // Render math segment with KaTeX
        try {
          return katex.renderToString(seg.raw, {
            displayMode: seg.display,
            throwOnError: false,
            strict: false,
            macros: KATEX_MACROS,
            trust: true,
          })
        } catch (error) {
          console.warn('❌ KaTeX rendering error:', error)
          return seg.display ? `$$${seg.raw}$$` : `$${seg.raw}$`
        }
      })
      .join('')

    console.log('✅ LATEX RENDERER: Complete')
    return result
  } catch (error) {
    console.warn('❌ LATEX RENDERER: Fatal error:', error)
    return text
  }
}

/**
 * Synchronous version - renders only KaTeX math (no TikZ support)
 * Use this for components that don't need TikZ diagrams
 *
 * This is the original implementation - kept for backward compatibility
 */
export function renderLatexInTextSync(text: string): string {
  if (!text) return ''

  try {
    const segments = normalizeForKatex(text)

    const result = segments
      .map((seg) => {
        if (seg.type === 'text') {
          return seg.raw
        }

        // Render math segment with KaTeX
        try {
          return katex.renderToString(seg.raw, {
            displayMode: seg.display,
            throwOnError: false,
            strict: false,
            macros: KATEX_MACROS,
            trust: true,
          })
        } catch (error) {
          console.warn('❌ KaTeX rendering error:', error)
          return seg.display ? `$$${seg.raw}$$` : `$${seg.raw}$`
        }
      })
      .join('')

    return result
  } catch (error) {
    console.warn('❌ LaTeX rendering error:', error)
    return text
  }
}
