import katex from 'katex'
import 'katex/dist/katex.min.css'

type Segment = { type: 'math'; raw: string; display: boolean } | { type: 'text'; raw: string }

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
    let start = i
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
 * Renders LaTeX expressions in text content
 * Supports both inline ($...$) and display ($$...$$) math
 * Also handles escaped dollar signs (\$) for literal dollar signs
 */
export function renderLatexInText(text: string): string {
  if (!text) return ''

  console.log('🔧 KATEX DEBUG: Input text:', text)
  console.log('🔧 KATEX DEBUG: Input (JSON):', JSON.stringify(text))

  try {
    const segments = normalizeForKatex(text)
    console.log('🔧 KATEX DEBUG: Segments:', segments)

    const result = segments
      .map((seg) => {
        if (seg.type === 'text') {
          console.log('🔧 KATEX DEBUG: Text segment:', seg.raw)
          return seg.raw
        }

        // Render math segment with KaTeX
        try {
          console.log('🔧 KATEX DEBUG: Rendering math:', seg.raw)
          const rendered = katex.renderToString(seg.raw, {
            displayMode: seg.display,
            throwOnError: false,
            strict: false,
            macros: KATEX_MACROS,
            trust: true, // Needed for advanced positioning commands
          })
          console.log('🔧 KATEX DEBUG: Rendered HTML length:', rendered.length)
          return rendered
        } catch (error) {
          console.warn('❌ KATEX ERROR:', error)
          return seg.display ? `$$${seg.raw}$$` : `$${seg.raw}$`
        }
      })
      .join('')

    console.log('🔧 KATEX DEBUG: Final output length:', result.length)
    return result
  } catch (error) {
    console.warn('❌ KATEX FATAL ERROR:', error)
    return text
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
