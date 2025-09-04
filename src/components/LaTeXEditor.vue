<template>
  <div class="latex-editor">
    <!-- Toolbar with common LaTeX expressions -->
    <div class="latex-toolbar">
      <button 
        v-for="symbol in commonSymbols" 
        :key="symbol.name"
        type="button"
        @click="insertSymbol(symbol.latex)"
        class="symbol-btn"
        :title="symbol.description"
      >
        {{ symbol.display }}
      </button>
      
      <div class="toolbar-divider"></div>
      
      <button 
        type="button"
        @click="showHelp = !showHelp"
        class="help-btn"
        title="LaTeX Help"
      >
        ?
      </button>
    </div>

    <!-- Text editor with auto-completion -->
    <div class="editor-container">
      <textarea 
        ref="textareaRef"
        v-model="localValue"
        @input="handleInput"
        @keydown="handleKeydown"
        @blur="hideAutoComplete"
        :placeholder="placeholder"
        class="latex-textarea"
        :rows="rows"
      ></textarea>
      
      <!-- Auto-completion dropdown -->
      <div 
        v-if="showAutoComplete && filteredSuggestions.length > 0"
        class="autocomplete-dropdown"
        :style="dropdownStyle"
      >
        <div 
          v-for="(suggestion, index) in filteredSuggestions"
          :key="suggestion.latex"
          @mousedown="selectSuggestion(suggestion)"
          class="autocomplete-item"
          :class="{ active: index === selectedIndex }"
        >
          <span class="suggestion-latex">{{ suggestion.latex }}</span>
          <span class="suggestion-desc">{{ suggestion.description }}</span>
        </div>
      </div>
    </div>

    <!-- Live preview -->
    <div v-if="localValue && showPreview" class="latex-preview">
      <h4>Preview:</h4>
      <div class="preview-content" v-html="renderLatexInText(localValue)"></div>
    </div>

    <!-- Help panel -->
    <div v-if="showHelp" class="help-panel">
      <div class="help-header">
        <h4>LaTeX Quick Reference</h4>
        <button @click="showHelp = false" class="close-help">×</button>
      </div>
      <div class="help-content">
        <div class="help-section">
          <h5>Basic Syntax:</h5>
          <ul>
            <li><code>$x^2$</code> → inline math</li>
            <li><code>$$x^2$$</code> → display math</li>
            <li><code>\frac{a}{b}</code> → fractions</li>
            <li><code>x^{2n}</code> → superscripts</li>
            <li><code>x_{i}</code> → subscripts</li>
          </ul>
        </div>
        <div class="help-section">
          <h5>Common Functions:</h5>
          <ul>
            <li><code>\sqrt{x}</code> → square root</li>
            <li><code>\sin, \cos, \tan</code> → trig functions</li>
            <li><code>\log, \ln</code> → logarithms</li>
            <li><code>\sum_{i=1}^n</code> → summation</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import katex from 'katex'

interface Props {
  modelValue: string
  placeholder?: string
  rows?: number
  showPreview?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter text with LaTeX... Use $...$ for inline math or $$...$$ for display math',
  rows: 3,
  showPreview: true
})

const emit = defineEmits<Emits>()

// Refs
const textareaRef = ref<HTMLTextAreaElement>()
const localValue = ref(props.modelValue)
const showAutoComplete = ref(false)
const showHelp = ref(false)
const selectedIndex = ref(0)
const currentQuery = ref('')
const cursorPosition = ref(0)
const dropdownStyle = ref({})

// Common LaTeX symbols for toolbar
const commonSymbols = [
  { name: 'fraction', latex: '\\frac{}{}', display: '½', description: 'Fraction' },
  { name: 'superscript', latex: '^{}', display: 'x²', description: 'Superscript' },
  { name: 'subscript', latex: '_{}', display: 'x₁', description: 'Subscript' },
  { name: 'sqrt', latex: '\\sqrt{}', display: '√', description: 'Square root' },
  { name: 'sum', latex: '\\sum_{}^{}', display: '∑', description: 'Summation' },
  { name: 'integral', latex: '\\int_{}^{}', display: '∫', description: 'Integral' },
  { name: 'infinity', latex: '\\infty', display: '∞', description: 'Infinity' },
  { name: 'pm', latex: '\\pm', display: '±', description: 'Plus/minus' },
  { name: 'times', latex: '\\times', display: '×', description: 'Multiplication' },
  { name: 'div', latex: '\\div', display: '÷', description: 'Division' },
  { name: 'leq', latex: '\\leq', display: '≤', description: 'Less than or equal' },
  { name: 'geq', latex: '\\geq', display: '≥', description: 'Greater than or equal' },
  { name: 'neq', latex: '\\neq', display: '≠', description: 'Not equal' },
  { name: 'approx', latex: '\\approx', display: '≈', description: 'Approximately' },
]

// Auto-completion suggestions
const latexSuggestions = [
  // Fractions and roots
  { latex: '\\frac{}{)', description: 'Fraction' },
  { latex: '\\sqrt{}', description: 'Square root' },
  { latex: '\\sqrt[3]{}', description: 'Cube root' },
  { latex: '\\sqrt[n]{}', description: 'nth root' },
  
  // Superscripts and subscripts
  { latex: '^{}', description: 'Superscript' },
  { latex: '_{}', description: 'Subscript' },
  
  // Trigonometric functions
  { latex: '\\sin', description: 'Sine' },
  { latex: '\\cos', description: 'Cosine' },
  { latex: '\\tan', description: 'Tangent' },
  { latex: '\\cot', description: 'Cotangent' },
  { latex: '\\sec', description: 'Secant' },
  { latex: '\\csc', description: 'Cosecant' },
  
  // Logarithms
  { latex: '\\log', description: 'Logarithm' },
  { latex: '\\ln', description: 'Natural logarithm' },
  { latex: '\\log_{}', description: 'Logarithm with base' },
  
  // Calculus
  { latex: '\\lim_{x \\to }', description: 'Limit' },
  { latex: '\\int', description: 'Integral' },
  { latex: '\\int_{}^{}', description: 'Definite integral' },
  { latex: '\\sum_{i=1}^{n}', description: 'Summation' },
  { latex: '\\prod_{i=1}^{n}', description: 'Product' },
  { latex: '\\frac{d}{dx}', description: 'Derivative' },
  { latex: '\\frac{\\partial}{\\partial x}', description: 'Partial derivative' },
  
  // Greek letters
  { latex: '\\alpha', description: 'Alpha (α)' },
  { latex: '\\beta', description: 'Beta (β)' },
  { latex: '\\gamma', description: 'Gamma (γ)' },
  { latex: '\\delta', description: 'Delta (δ)' },
  { latex: '\\epsilon', description: 'Epsilon (ε)' },
  { latex: '\\theta', description: 'Theta (θ)' },
  { latex: '\\lambda', description: 'Lambda (λ)' },
  { latex: '\\mu', description: 'Mu (μ)' },
  { latex: '\\pi', description: 'Pi (π)' },
  { latex: '\\sigma', description: 'Sigma (σ)' },
  { latex: '\\phi', description: 'Phi (φ)' },
  { latex: '\\omega', description: 'Omega (ω)' },
  
  // Symbols
  { latex: '\\infty', description: 'Infinity (∞)' },
  { latex: '\\pm', description: 'Plus/minus (±)' },
  { latex: '\\mp', description: 'Minus/plus (∓)' },
  { latex: '\\times', description: 'Multiplication (×)' },
  { latex: '\\div', description: 'Division (÷)' },
  { latex: '\\cdot', description: 'Dot multiplication (·)' },
  { latex: '\\leq', description: 'Less than or equal (≤)' },
  { latex: '\\geq', description: 'Greater than or equal (≥)' },
  { latex: '\\neq', description: 'Not equal (≠)' },
  { latex: '\\approx', description: 'Approximately (≈)' },
  { latex: '\\equiv', description: 'Equivalent (≡)' },
  
  // Arrows
  { latex: '\\rightarrow', description: 'Right arrow (→)' },
  { latex: '\\leftarrow', description: 'Left arrow (←)' },
  { latex: '\\leftrightarrow', description: 'Left-right arrow (↔)' },
  { latex: '\\Rightarrow', description: 'Double right arrow (⇒)' },
  { latex: '\\Leftarrow', description: 'Double left arrow (⇐)' },
  { latex: '\\Leftrightarrow', description: 'Double left-right arrow (⇔)' },
  
  // Sets
  { latex: '\\in', description: 'Element of (∈)' },
  { latex: '\\notin', description: 'Not element of (∉)' },
  { latex: '\\subset', description: 'Subset (⊂)' },
  { latex: '\\supset', description: 'Superset (⊃)' },
  { latex: '\\cup', description: 'Union (∪)' },
  { latex: '\\cap', description: 'Intersection (∩)' },
  { latex: '\\emptyset', description: 'Empty set (∅)' },
  
  // Brackets
  { latex: '\\left( \\right)', description: 'Parentheses' },
  { latex: '\\left[ \\right]', description: 'Square brackets' },
  { latex: '\\left\\{ \\right\\}', description: 'Curly braces' },
  { latex: '\\left| \\right|', description: 'Absolute value' },
]

// Computed
const filteredSuggestions = computed(() => {
  if (!currentQuery.value) return []
  
  const query = currentQuery.value.toLowerCase()
  return latexSuggestions.filter(suggestion => 
    suggestion.latex.toLowerCase().includes(query) ||
    suggestion.description.toLowerCase().includes(query)
  ).slice(0, 8) // Limit to 8 suggestions
})

// Watch for model value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localValue.value) {
    localValue.value = newValue
  }
})

watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// Methods
const handleInput = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const cursorPos = textarea.selectionStart
  cursorPosition.value = cursorPos
  
  // Check for LaTeX command trigger
  const textBeforeCursor = localValue.value.substring(0, cursorPos)
  const lastBackslash = textBeforeCursor.lastIndexOf('\\')
  
  if (lastBackslash !== -1 && lastBackslash >= cursorPos - 20) {
    const potentialCommand = textBeforeCursor.substring(lastBackslash)
    if (potentialCommand.length > 1 && !potentialCommand.includes(' ')) {
      currentQuery.value = potentialCommand
      showAutoComplete.value = true
      selectedIndex.value = 0
      updateDropdownPosition()
    } else {
      showAutoComplete.value = false
    }
  } else {
    showAutoComplete.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showAutoComplete.value) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredSuggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
    case 'Tab':
      event.preventDefault()
      if (filteredSuggestions.value[selectedIndex.value]) {
        selectSuggestion(filteredSuggestions.value[selectedIndex.value])
      }
      break
    case 'Escape':
      showAutoComplete.value = false
      break
  }
}

const selectSuggestion = (suggestion: typeof latexSuggestions[0]) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const cursorPos = cursorPosition.value
  const textBeforeCursor = localValue.value.substring(0, cursorPos)
  const lastBackslash = textBeforeCursor.lastIndexOf('\\')
  
  if (lastBackslash !== -1) {
    const beforeCommand = localValue.value.substring(0, lastBackslash)
    const afterCursor = localValue.value.substring(cursorPos)
    
    localValue.value = beforeCommand + suggestion.latex + afterCursor
    
    // Position cursor appropriately
    nextTick(() => {
      const newCursorPos = lastBackslash + suggestion.latex.length
      
      // If the suggestion has {}, position cursor inside the first {}
      const firstBrace = suggestion.latex.indexOf('{}')
      if (firstBrace !== -1) {
        textarea.setSelectionRange(lastBackslash + firstBrace + 1, lastBackslash + firstBrace + 1)
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
      
      textarea.focus()
    })
  }
  
  showAutoComplete.value = false
}

const insertSymbol = (latex: string) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const cursorPos = textarea.selectionStart
  const textBefore = localValue.value.substring(0, cursorPos)
  const textAfter = localValue.value.substring(textarea.selectionEnd)
  
  localValue.value = textBefore + latex + textAfter
  
  nextTick(() => {
    // Position cursor inside first {} if present
    const firstBrace = latex.indexOf('{}')
    if (firstBrace !== -1) {
      const newPos = cursorPos + firstBrace + 1
      textarea.setSelectionRange(newPos, newPos)
    } else {
      const newPos = cursorPos + latex.length
      textarea.setSelectionRange(newPos, newPos)
    }
    textarea.focus()
  })
}

const hideAutoComplete = () => {
  // Delay hiding to allow for click events
  setTimeout(() => {
    showAutoComplete.value = false
  }, 150)
}

const updateDropdownPosition = () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (!textarea) return
    
    const rect = textarea.getBoundingClientRect()
    const lineHeight = 20 // Approximate line height
    const lines = localValue.value.substring(0, cursorPosition.value).split('\n').length
    
    dropdownStyle.value = {
      top: `${(lines - 1) * lineHeight + 25}px`,
      left: '10px',
      zIndex: '1000'
    }
  })
}

const renderLatexInText = (text: string): string => {
  if (!text) return ''
  
  try {
    // Replace display math ($$...$$)
    let result = text.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
      try {
        return katex.renderToString(latex.trim(), { 
          displayMode: true, 
          throwOnError: false,
          strict: false
        })
      } catch {
        return match
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
      } catch {
        return match
      }
    })
    
    return result
  } catch (error) {
    console.warn('LaTeX rendering error:', error)
    return text
  }
}

onMounted(() => {
  localValue.value = props.modelValue
})
</script>

<style scoped>
.latex-editor {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.latex-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  align-items: center;
}

.symbol-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.symbol-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #d1d5db;
  margin: 0 4px;
}

.help-btn {
  padding: 4px 8px;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-btn:hover {
  background: #2563eb;
}

.editor-container {
  position: relative;
}

.latex-textarea {
  width: 100%;
  padding: 12px;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  line-height: 1.5;
  resize: vertical;
  min-height: 60px;
}

.latex-textarea:focus {
  background: #fefefe;
}

.autocomplete-dropdown {
  position: absolute;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  min-width: 250px;
}

.autocomplete-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background: #f3f4f6;
}

.suggestion-latex {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: bold;
  color: #374151;
}

.suggestion-desc {
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
}

.latex-preview {
  padding: 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  min-height: 50px;
}

.latex-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;
}

.preview-content {
  font-size: 16px;
  line-height: 1.6;
}

.help-panel {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 0;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.help-header h4 {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.close-help {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-help:hover {
  background: #e5e7eb;
  color: #374151;
}

.help-content {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.help-section h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #374151;
  font-weight: 600;
}

.help-section ul {
  margin: 0;
  padding-left: 16px;
  list-style-type: disc;
}

.help-section li {
  margin-bottom: 4px;
  font-size: 12px;
  color: #4b5563;
}

.help-section code {
  background: #f3f4f6;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  color: #dc2626;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .latex-toolbar {
    gap: 2px;
    padding: 6px;
  }
  
  .symbol-btn {
    min-width: 24px;
    height: 24px;
    font-size: 12px;
    padding: 2px 4px;
  }
  
  .help-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .autocomplete-dropdown {
    min-width: 200px;
  }
}
</style>




