<template>
  <div class="latex-demo">
    <div class="demo-header">
      <h1>🧮 LaTeX Math Rendering Demo</h1>
      <p>Test the new LaTeX capabilities in assessment questions</p>
    </div>

    <div class="demo-sections">
      <!-- Editor Demo -->
      <div class="demo-section">
        <h2>✏️ LaTeX Editor with Auto-completion</h2>
        <p>Try typing LaTeX expressions like <code>\frac</code>, <code>\sqrt</code>, or <code>\sum</code> to see auto-completion:</p>
        
        <LaTeXEditor 
          v-model="editorContent"
          placeholder="Type LaTeX expressions... Try typing \frac or \sqrt to see auto-completion!"
          :rows="4"
        />
      </div>

      <!-- Sample Questions -->
      <div class="demo-section">
        <h2>📝 Sample Math Questions</h2>
        <div class="sample-questions">
          <div 
            v-for="(sample, index) in sampleQuestions" 
            :key="index"
            class="sample-question"
          >
            <div class="question-header">
              <h3>Question {{ index + 1 }}</h3>
              <button @click="loadSample(sample.latex)" class="load-btn">
                Load in Editor
              </button>
            </div>
            <div class="question-preview">
              <div class="latex-source">
                <strong>LaTeX Source:</strong>
                <code>{{ sample.latex }}</code>
              </div>
              <div class="rendered-output">
                <strong>Rendered Output:</strong>
                <div v-html="renderLatexInText(sample.latex)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reference -->
      <div class="demo-section">
        <h2>📚 LaTeX Quick Reference</h2>
        <div class="reference-grid">
          <div class="ref-category">
            <h4>Basic Math</h4>
            <div class="ref-items">
              <div class="ref-item">
                <code>$x^2$</code> → <span v-html="renderLatexInText('$x^2$')"></span>
              </div>
              <div class="ref-item">
                <code>$x_1$</code> → <span v-html="renderLatexInText('$x_1$')"></span>
              </div>
              <div class="ref-item">
                <code>$\frac{a}{b}$</code> → <span v-html="renderLatexInText('$\\frac{a}{b}$')"></span>
              </div>
              <div class="ref-item">
                <code>$\sqrt{x}$</code> → <span v-html="renderLatexInText('$\\sqrt{x}$')"></span>
              </div>
            </div>
          </div>

          <div class="ref-category">
            <h4>Symbols</h4>
            <div class="ref-items">
              <div class="ref-item">
                <code>$\pm$</code> → <span v-html="renderLatexInText('$\\pm$')"></span>
              </div>
              <div class="ref-item">
                <code>$\times$</code> → <span v-html="renderLatexInText('$\\times$')"></span>
              </div>
              <div class="ref-item">
                <code>$\leq$</code> → <span v-html="renderLatexInText('$\\leq$')"></span>
              </div>
              <div class="ref-item">
                <code>$\infty$</code> → <span v-html="renderLatexInText('$\\infty$')"></span>
              </div>
            </div>
          </div>

          <div class="ref-category">
            <h4>Advanced</h4>
            <div class="ref-items">
              <div class="ref-item">
                <code>$\sum_{i=1}^n$</code> → <span v-html="renderLatexInText('$\\sum_{i=1}^n$')"></span>
              </div>
              <div class="ref-item">
                <code>$\int_0^1$</code> → <span v-html="renderLatexInText('$\\int_0^1$')"></span>
              </div>
              <div class="ref-item">
                <code>$\lim_{x \to 0}$</code> → <span v-html="renderLatexInText('$\\lim_{x \\to 0}$')"></span>
              </div>
              <div class="ref-item">
                <code>$\alpha, \beta, \pi$</code> → <span v-html="renderLatexInText('$\\alpha, \\beta, \\pi$')"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LaTeXEditor from '@/components/LaTeXEditor.vue'
import { renderLatexInText } from '@/utils/latexUtils'

const editorContent = ref('Try typing some LaTeX! For example:\n\n$x^2 + 5x - 6 = 0$\n\n$$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$')

const sampleQuestions = [
  {
    latex: 'What is the solution to the quadratic equation $x^2 + 5x - 6 = 0$?'
  },
  {
    latex: 'Calculate the definite integral: $$\\int_{0}^{1} x^2 \\, dx$$'
  },
  {
    latex: 'Simplify the expression: $\\frac{2x^3 - 8x}{4x}$ where $x \\neq 0$'
  },
  {
    latex: 'Find the limit: $\\lim_{x \\to \\infty} \\frac{3x^2 + 2x - 1}{x^2 - 5}$'
  },
  {
    latex: 'If $\\sin(\\theta) = \\frac{3}{5}$ and $\\theta$ is in the first quadrant, find $\\cos(\\theta)$'
  },
  {
    latex: 'What is the sum of the geometric series: $$\\sum_{n=0}^{\\infty} \\frac{1}{2^n}$$'
  }
]

const loadSample = (latex: string) => {
  editorContent.value = latex
}
</script>

<style scoped>
.latex-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.demo-header h1 {
  color: #1f2937;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.demo-header p {
  color: #6b7280;
  font-size: 1.2rem;
}

.demo-sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.demo-section {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
  color: #1f2937;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.demo-section p {
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.6;
}

.demo-section code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  color: #dc2626;
  font-size: 0.9rem;
}

.sample-questions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sample-question {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.question-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.load-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.load-btn:hover {
  background: #2563eb;
}

.question-preview {
  padding: 20px;
}

.latex-source {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #6b7280;
}

.latex-source code {
  background: transparent;
  color: #374151;
  font-size: 0.95rem;
  display: block;
  margin-top: 5px;
  white-space: pre-wrap;
}

.rendered-output {
  padding: 12px;
  background: #f0f4ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.rendered-output div {
  margin-top: 10px;
  font-size: 1.1rem;
  line-height: 1.6;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.ref-category {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.ref-category h4 {
  color: #1f2937;
  margin-bottom: 15px;
  font-size: 1.1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.ref-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.ref-item code {
  min-width: 120px;
  text-align: left;
  background: #f3f4f6;
  font-size: 0.85rem;
}

.ref-item span {
  flex: 1;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .latex-demo {
    padding: 15px;
  }
  
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .reference-grid {
    grid-template-columns: 1fr;
  }
  
  .question-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .ref-item {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .ref-item code {
    min-width: auto;
  }
}
</style>







