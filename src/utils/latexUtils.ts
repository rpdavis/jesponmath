import katex from 'katex'
import 'katex/dist/katex.min.css'

type Segment = { type: 'math'; raw: string; display: boolean } | { type: 'text'; raw: string }

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
      // text-mode: \$ should become a literal $
      return { ...seg, raw: seg.raw.replace(/\\?\$/g, '$') }
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

  // DEBUG: Log the RAW input
  console.log('🔴 RAW INPUT to renderLatexInText:', text)
  console.log('🔴 RAW INPUT (escaped):', JSON.stringify(text))

  try {
    const segments = normalizeForKatex(text)

    // Debug logging
    console.log('Segments after normalize:', segments)

    return segments
      .map((seg) => {
        if (seg.type === 'text') {
          // Return text as-is (already has \$ converted to $)
          return seg.raw
        }

        // Render math segment with KaTeX
        try {
          console.log('Rendering math:', seg.raw)
          return katex.renderToString(seg.raw, {
            displayMode: seg.display,
            throwOnError: false,
            strict: false,
          })
        } catch (error) {
          console.warn('LaTeX render error:', error)
          // Return original wrapped in $ or $$ on error
          return seg.display ? `$$${seg.raw}$$` : `$${seg.raw}$`
        }
      })
      .join('')
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
      error: error instanceof Error ? error.message : 'Unknown LaTeX error',
    }
  }
}
