import templates from '../../question_templates_for_review.json'

export type TemplateVariable =
  | { type: 'random'; min?: number; max?: number; options?: string[] }
  | { type: 'randomDecimal'; min: number; max: number; decimalPlaces?: number }
  | {
      type: 'randomFraction'
      minNumerator: number
      maxNumerator: number
      minDenominator: number
      maxDenominator: number
    }
  | { type: 'randomList'; length: number; generator: string }
  | { type: 'derived'; from: string; map: Record<string, string> }
  | { type: 'template'; template: string }
  | { type: 'calculated'; formula: string }
  | { type: 'ai-generated'; prompt: string }
  | { type: 'random'; options: string[] }

export interface QuestionTemplateRecord {
  id: string
  name: string
  subject: 'math' | 'ela' | 'other'
  topic?: string
  questionType: string
  questionTemplate: string
  answerTemplate: string
  alternativeAnswers?: string[]
  optionsTemplate?: string[]
  explanationTemplate?: string
  requiresPhoto?: boolean
  rubricId?: string | null
  variableGenerators?: Record<string, any>
  scenarios?: Array<Record<string, string>>
  exampleQuestion?: string
  exampleAnswer?: string
  isActive: boolean
}

type Vars = Record<string, any>

function gcd(a: number, b: number): number {
  if (!b) return Math.abs(a)
  return gcd(b, a % b)
}

function simplifyFraction(num: number, den: number): string {
  const g = gcd(num, den)
  const n = num / g
  const d = den / g
  return d === 1 ? `${n}` : `${n}/${d}`
}

function parseFraction(frac: string): { num: number; den: number } {
  if (frac.includes('/')) {
    const [n, d] = frac.split('/').map(Number)
    return { num: n, den: d }
  }
  const num = Number(frac)
  return { num, den: 1 }
}

function calculateOperation(a: number, op: string, b: number): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
    case '*':
      return a * b
    case '÷':
    case '/':
      return b === 0 ? NaN : a / b
    default:
      return NaN
  }
}

function calculateFractionOperation(f1: string, op: string, f2: string): string {
  const a = parseFraction(f1)
  const b = parseFraction(f2)
  let num = 0
  let den = 1
  if (op === '+') {
    num = a.num * b.den + b.num * a.den
    den = a.den * b.den
  } else if (op === '-') {
    num = a.num * b.den - b.num * a.den
    den = a.den * b.den
  }
  return simplifyFraction(num, den)
}

function calculateDecimalOperation(a: number, op: string, b: number): number {
  return calculateOperation(a, op, b)
}

function roundToCents(value: number): string {
  return value.toFixed(2)
}

function timeAddMinutes(hour: number, minute: number, delta: number): string {
  const total = hour * 60 + minute + delta
  let h = Math.floor(total / 60) % 24
  const m = total % 60
  const suffix = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  if (h > 12) h -= 12
  return `${h}:${m.toString().padStart(2, '0')} ${suffix}`
}

function randomRational(): string {
  const isFraction = Math.random() < 0.5
  if (isFraction) {
    const n = Math.floor(Math.random() * 9) + 1
    const d = Math.floor(Math.random() * 9) + 1
    return simplifyFraction(n, d)
  }
  const value = (Math.random() * 3 - 1.5).toFixed(2)
  return value
}

function sortRationals(list: string[]): string {
  const parsed = list.map((v) => ({ v, n: parseFraction(v) }))
  parsed.sort((a, b) => a.n.num / a.n.den - b.n.num / b.n.den)
  return parsed.map((p) => p.v).join(', ')
}

function replaceVars(text: string, vars: Vars): string {
  return text.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined && val !== null ? String(val) : ''
  })
}

function generateVariable(key: string, spec: any, vars: Vars): any {
  if (!spec) return ''
  if (spec.type === 'random' && spec.options) {
    const choice = spec.options[Math.floor(Math.random() * spec.options.length)]
    return choice
  }
  switch (spec.type) {
    case 'random': {
      const min = spec.min ?? 0
      const max = spec.max ?? 1
      return Math.floor(Math.random() * (max - min + 1)) + min
    }
    case 'randomDecimal': {
      const { min, max, decimalPlaces = 2 } = spec
      const val = Math.random() * (max - min) + min
      return Number(val.toFixed(decimalPlaces))
    }
    case 'randomFraction': {
      const n =
        Math.floor(Math.random() * (spec.maxNumerator - spec.minNumerator + 1)) + spec.minNumerator
      const d =
        Math.floor(Math.random() * (spec.maxDenominator - spec.minDenominator + 1)) +
        spec.minDenominator
      return simplifyFraction(n, d)
    }
    case 'randomList': {
      const arr: string[] = []
      for (let i = 0; i < spec.length; i++) {
        if (spec.generator === 'randomRational') arr.push(randomRational())
      }
      return arr
    }
    case 'derived': {
      const base = vars[spec.from]
      return spec.map[base] ?? base
    }
    case 'template': {
      return replaceVars(spec.template, vars)
    }
    case 'calculated': {
      // Unsafe eval minimized by restricting to provided helpers and vars
      const helpers = {
        calculateOperation,
        calculateFractionOperation,
        calculateDecimalOperation,
        roundToCents,
        timeAddMinutes,
        sortRationals,
        randomRational,
        Math,
      }
      const fn = new Function(...Object.keys({ ...vars, ...helpers }), `return ${spec.formula}`)
      return fn(...Object.values({ ...vars, ...helpers }))
    }
    case 'ai-generated': {
      // Placeholder; actual AI call happens upstream. Use prompt as stub.
      return `[AI-generated: ${spec.prompt}]`
    }
    default:
      return ''
  }
}

function fillVariables(template: QuestionTemplateRecord): Vars {
  const vars: Vars = {}
  const generators = template.variableGenerators || {}
  for (const key of Object.keys(generators)) {
    vars[key] = generateVariable(key, generators[key], vars)
  }
  return vars
}

function buildFromTemplate(
  qt: QuestionTemplateRecord,
  vars: Vars,
  scenario?: Record<string, string>,
): {
  question: string
  answer: string
  explanation?: string
  options?: string[]
  alternativeAnswers?: string[]
} {
  const mergedVars = { ...vars }
  if (scenario) {
    Object.keys(scenario).forEach((k) => {
      mergedVars[k] = replaceVars(scenario[k], mergedVars)
    })
  }

  const question = replaceVars(qt.questionTemplate, mergedVars)
  const answer = replaceVars(qt.answerTemplate, mergedVars)
  const explanation = qt.explanationTemplate
    ? replaceVars(qt.explanationTemplate, mergedVars)
    : undefined
  const options = qt.optionsTemplate
    ? qt.optionsTemplate.map((opt) => replaceVars(opt, mergedVars))
    : undefined
  const alternativeAnswers = qt.alternativeAnswers
    ? qt.alternativeAnswers.map((alt) => replaceVars(alt, mergedVars))
    : undefined
  return { question, answer, explanation, options }
}

function pickScenario(qt: QuestionTemplateRecord): Record<string, string> | undefined {
  if (!qt.scenarios || qt.scenarios.length === 0) return undefined
  const idx = Math.floor(Math.random() * qt.scenarios.length)
  return qt.scenarios[idx]
}

function matchTemplates(
  subject: 'math' | 'ela' | 'other',
  goalText: string,
  areaOfNeed: string,
): QuestionTemplateRecord[] {
  const text = `${goalText} ${areaOfNeed}`.toLowerCase()
  return (templates as QuestionTemplateRecord[]).filter((t) => {
    if (!t.isActive) return false
    if (t.subject !== subject) return false
    if (!t.topic) return true
    return text.includes(t.topic.toLowerCase())
  })
}

type GenerationContext = {
  gradeLevel?: number
  topicHint?: string
  areaOfNeedHint?: string
}

const topicKeywords: Record<string, string[]> = {
  'two-step equation': ['two-step equation', 'multi-step equation', 'solve for x', 'equation'],
  'multi-step word problem': ['multi-step word problem', 'multi step word problem', 'word problem'],
  'word problem': ['word problem', 'story problem'],
  fraction: ['fraction', 'fractions'],
  decimal: ['decimal', 'decimals'],
  'percentage word problem': ['percent', 'percentage'],
  'elapsed time': [
    'elapsed time',
    'elapse time',
    'time problem',
    'time calculation',
    'counting on',
  ],
  'money word problem': ['money', 'dollars', 'change'],
  'rational number': ['rational number', 'integer', 'ordering numbers'],
  geometry: ['area', 'perimeter', 'geometry'],
  'graph interpretation': ['graph', 'chart', 'bar graph'],
  'math fluency': ['fluency', 'math facts'],
  'reading comprehension': [
    'reading comprehension',
    'comprehension',
    'text evidence',
    'main idea',
    'inference',
  ],
  vocabulary: ['vocabulary', 'context clue', 'word meaning'],
  'reading fluency': ['reading fluency', 'wpm', 'words per minute'],
  phonics: ['phonics', 'decoding', 'decode'],
  grammar: ['grammar', 'syntax', 'sentence'],
  writing: ['writing', 'essay', 'paragraph'],
  behavior: ['behavior', 'on task', 'on-task'],
  'work completion': ['work completion', 'turn in', 'submit'],
}

function topicMatches(text: string, topic?: string): boolean {
  if (!topic) return true
  const t = topic.toLowerCase()
  if (text.includes(t)) return true
  const keywords = topicKeywords[t]
  if (!keywords) return false
  return keywords.some((k) => text.includes(k.toLowerCase()))
}

function defaultRubricForTemplate(t: QuestionTemplateRecord): string | null {
  const name = t.name.toLowerCase()
  const topic = (t.topic || '').toLowerCase()
  if (
    name.includes('writing') ||
    topic.includes('writing') ||
    topic.includes('essay') ||
    topic.includes('paragraph')
  ) {
    return 'default-writing-rubric'
  }
  if (name.includes('citing') || name.includes('textual evidence')) {
    return 'default-reading-rubric'
  }
  return null
}

function finalizeRubricId(t: QuestionTemplateRecord): string | null {
  if (t.rubricId && t.rubricId.trim() !== '') return t.rubricId
  const def = defaultRubricForTemplate(t)
  return def
}

function resolveAiPlaceholder(prompt: string, ctx: GenerationContext): string {
  const grade = ctx.gradeLevel ? `grade ${ctx.gradeLevel}` : 'appropriate grade level'
  const topic = ctx.topicHint || ctx.areaOfNeedHint || 'the goal topic'
  return prompt.replace(/{{\s*gradeLevel\s*}}/g, grade).replace(/{{\s*topic\s*}}/g, topic)
}

export interface AIRequest {
  key: string
  prompt: string
}

interface GeneratedTemplateResult {
  question: string
  answer: string
  explanation?: string
  options?: string[]
  alternativeAnswers?: string[]
  requiresPhoto?: boolean
  rubricId?: string | null
  aiRequests?: AIRequest[]
}

export function generateFromJsonTemplate(
  subject: 'math' | 'ela' | 'other',
  goalText: string,
  areaOfNeed: string,
  context: GenerationContext = {},
  assessmentMethod?: 'app' | 'paper' | 'hybrid',
): GeneratedTemplateResult | null {
  const text =
    `${goalText} ${areaOfNeed} ${context.topicHint || ''} ${context.areaOfNeedHint || ''}`.toLowerCase()
  const candidates = (templates as QuestionTemplateRecord[]).filter((t) => {
    if (!t.isActive) return false
    if (t.subject !== subject) return false
    return topicMatches(text, t.topic)
  })

  if (!candidates.length) return null

  // Rank candidates by assessment method fit
  const scored = candidates
    .map((t) => {
      let score = 0
      // Topic specificity boost: count keyword hits
      if (t.topic) {
        const kw = topicKeywords[t.topic.toLowerCase()] || []
        const hits = kw.reduce((acc, k) => (text.includes(k.toLowerCase()) ? acc + 1 : acc), 0)
        score += hits * 2 // prioritize explicit topic hits
        if (text.includes((t.topic || '').toLowerCase())) score += 3
      }
      if (assessmentMethod === 'app') {
        // prefer no file/rubric requirements
        if (t.requiresPhoto) score -= 1
        if (t.rubricId) score -= 0.5
      } else if (assessmentMethod === 'paper') {
        if (t.requiresPhoto) score += 1
        if (t.rubricId) score += 1
      } else if (assessmentMethod === 'hybrid') {
        if (t.requiresPhoto) score += 0.5
      }
      return { t, score }
    })
    .sort((a, b) => b.score - a.score)

  // Pick best-scored; if ties, random among top ties
  const bestScore = scored[0].score
  const top = scored.filter((s) => s.score === bestScore)
  const qt = top[Math.floor(Math.random() * top.length)].t

  // Seed vars with context (e.g., gradeLevel)
  const baseVars: Vars = {}
  if (context.gradeLevel) baseVars.gradeLevel = context.gradeLevel
  const vars = { ...baseVars, ...fillVariables(qt) }
  const aiRequests: AIRequest[] = []
  // Enrich AI-generated placeholders with context (grade/topic)
  Object.keys(vars).forEach((k) => {
    if (typeof vars[k] === 'string' && String(vars[k]).startsWith('[AI-generated:')) {
      const prompt = resolveAiPlaceholder(
        String(vars[k]).replace('[AI-generated: ', '').replace(']', ''),
        context,
      )
      aiRequests.push({ key: k, prompt })
      vars[k] = ''
    }
  })

  const scenario = pickScenario(qt)
  const built = buildFromTemplate(qt, vars, scenario)
  return {
    ...built,
    requiresPhoto: qt.requiresPhoto,
    rubricId: finalizeRubricId(qt),
    aiRequests: aiRequests.length ? aiRequests : undefined,
    alternativeAnswers: built.alternativeAnswers,
  }
}












