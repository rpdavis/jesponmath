import type { MathProblem } from './mathProblemGenerator';

export interface PrintableAssessmentOptions {
  title: string;
  subtitle?: string;
  problems: MathProblem[];
  assessmentNumber?: number;
  instructions?: string;
  teacherName?: string;
  showAnswers?: boolean;
  columnsCount?: number;
  numberType?: 'integers' | 'negative-integers' | 'decimals' | 'money';
}

export class PrintableAssessmentGenerator {
  static generateHTML(options: PrintableAssessmentOptions): string {
    const {
      title,
      subtitle,
      problems,
      assessmentNumber = 1,
      instructions = "Solve each problem in the box. Show your work.",
      teacherName = "Teacher",
      showAnswers = false,
      columnsCount = 2
    } = options;

    const css = this.generateCSS();
    const problemsHTML = this.generateProblemsGrid(problems, showAnswers, columnsCount, options.numberType);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}${assessmentNumber ? ` - Assessment ${assessmentNumber}` : ''}</title>
    <style>${css}</style>
</head>
<body>
    <header>
        <div class="title">${title}${subtitle ? ` — ${subtitle}` : ''}</div>
        <div class="meta">
            <div class="field name">Name:</div>
            <div class="field">Date:</div>
            <div class="field">Score:</div>
        </div>
    </header>

    <section class="assessment">
        ${assessmentNumber ? `<h2>Assessment ${assessmentNumber}</h2>` : ''}
        <div class="legend">${instructions}</div>
        <div class="problems-grid">
            ${problemsHTML}
        </div>
        <footer>${teacherName}</footer>
    </section>
</body>
</html>`;
  }

  private static generateCSS(): string {
    return `
:root {
    --ink: #111;
    --muted: #555;
    --border: #000;
    --accent: #0b62a3;
    --line: #bbb;
}

@page {
    size: letter;
    margin: 0.5in;
}

html, body {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Noto Sans", "Liberation Sans", sans-serif;
    color: var(--ink);
}

header {
    padding: 0.25rem 0;
    border-bottom: 3px solid var(--border);
}

.title {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.3px;
}

.meta {
    display: flex;
    gap: 1rem;
    font-size: 0.95rem;
    margin-top: 4px;
    color: var(--muted);
}

.meta .field {
    border: 1.5px solid var(--border);
    padding: 6px 8px;
    border-radius: 8px;
    min-width: 180px;
}

section.assessment {
    break-before: page;
}

section.assessment:first-of-type {
    margin-top: 0.1rem;
    break-before: auto;
}

h2 {
    margin: 10px 0 0;
    font-size: 1.1rem;
    font-weight: 800;
}

.problems-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: start;
}

.problems-grid.single-column {
    grid-template-columns: 1fr;
}

.problem-box {
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
    break-inside: avoid;
    min-height: 240px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

.problem-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.problem-num {
    font-weight: 800;
    font-size: 0.95rem;
    background: #f4f4f4;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--border);
}

.work-hint {
    font-size: 0.8rem;
    color: var(--muted);
}

.vertical-problem {
    font-family: "Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 23px;
    line-height: 1.25;
    margin-top: 6px;
    margin-bottom: 10px;
    width: 10ch;
    margin-left: 3rem;
}

.vp-line {
    display: flex;
}

.vp-lhs {
    width: 2ch;
}

.vp-rhs {
    flex: 1;
    text-align: right;
}

.hline {
    border-top: 2px solid var(--border);
    margin: 6px 0 8px;
}

.work-lines {
    flex: 1;
    border-radius: 6px;
}

.answer {
    padding: 0.3rem;
    margin-top: 10px;
    height: 3rem;
    margin-left: 13rem;
    font-size: 0.9rem;
    width: 25%;
    display: block;
    place-content: center flex-start;
    flex-direction: row;
}

.answer .blank {
    border-bottom: 2px solid var(--border);
    min-width: 160px;
    display: inline-block;
}

.answer.show-answer {
    font-weight: bold;
    color: var(--accent);
}

/* Long Division Styles */
.long-division-problem {
    font-family: "Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 23px;
    line-height: 1.25;
    margin-top: 6px;
    margin-bottom: 10px;
    width: 10ch;
    margin-left: 3rem;
}

.long-division {
    display: inline-grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    gap: 0.2rem 0.2rem;
}

.divisor {
    grid-column: 1;
    grid-row: 2;
    padding-right: 0.45rem;
}

.bracket {
    grid-column: 2;
    grid-row: 2;
    position: relative;
    padding-left: 0.45rem;
    border-top: 2px solid var(--border);
}

.bracket::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    border-left: 2px solid var(--border);
}

.dividend {
    display: inline-block;
}

.quotient {
    grid-column: 2;
    grid-row: 1;
    align-self: end;
    justify-self: end;
    min-width: 3ch;
    text-align: right;
    padding-bottom: 0.1rem;
}

.q-blank {
    border-bottom: 1px dotted #999;
    min-width: 4ch;
    height: 1.1em;
    display: inline-block;
}

footer {
    margin-top: 8px;
    font-size: 0.8rem;
    color: var(--muted);
}

.legend {
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

@media print {
    header {
        border-bottom-width: 2.5px;
    }
    .problem-box {
        min-height: 260px;
    }
}
`;
  }

  private static formatNumber(num: number, numberType?: string): string {
    switch (numberType) {
      case 'money':
        return `$${num.toFixed(2)}`;
      case 'decimals':
        // Remove trailing zeros but keep at least 1 decimal place if it was a decimal
        const hasDecimals = num % 1 !== 0;
        if (hasDecimals) {
          return num.toFixed(4).replace(/\.?0+$/, '');
        }
        return num.toString();
      case 'negative-integers':
      case 'integers':
      default:
        return num.toLocaleString();
    }
  }

  private static generateProblemsGrid(problems: MathProblem[], showAnswers: boolean, columns: number, numberType?: string): string {
    const gridClass = columns === 1 ? 'problems-grid single-column' : 'problems-grid';
    
    return problems.map((problem, index) => {
      const problemNumber = index + 1;
      const marginClass = (problemNumber === 7 || problemNumber === 8) ? ' mg' : '';
      
      // Special handling for division problems
      if (problem.operator === '÷') {
        const quotient = showAnswers ? Math.floor(problem.operand1 / problem.operand2) : '';
        const remainder = showAnswers ? problem.operand1 % problem.operand2 : 0;
        const remainderText = remainder > 0 ? ` r${remainder}` : '';
        
        return `
    <div class="problem-box${marginClass}">
        <div class="problem-head">
            <div class="problem-num">#${problemNumber}</div>
            <div class="work-hint">Show your work</div>
        </div>
        <div class="long-division-problem" aria-label="${problem.operand1} divided by ${problem.operand2}">
            <div class="long-division">
                <div class="quotient">
                    ${showAnswers ? `${quotient}${remainderText}` : ''}
                </div>
                <div class="divisor">${this.formatNumber(problem.operand2, numberType)}</div>
                <div class="bracket">
                    <span class="dividend">${this.formatNumber(problem.operand1, numberType)}</span>
                </div>
            </div>
        </div>
        <div class="work-lines" aria-hidden="true"></div>
        <div class="answer${showAnswers ? ' show-answer' : ''}">
            Answer: ${showAnswers ? `${quotient}${remainderText}` : '<span class="blank"></span>'}
        </div>
    </div>`;
      }
      
      // Standard vertical format for other operations
      return `
    <div class="problem-box${marginClass}">
        <div class="problem-head">
            <div class="problem-num">#${problemNumber}</div>
            <div class="work-hint">Show your work</div>
        </div>
        <div class="vertical-problem" aria-label="${problem.operand1} ${problem.operator === '×' ? 'times' : problem.operator === '+' ? 'plus' : 'minus'} ${problem.operand2}">
            <div class="vp-line">
                <span class="vp-lhs"></span>
                <span class="vp-rhs">${this.formatNumber(problem.operand1, numberType)}</span>
            </div>
            <div class="vp-line">
                <span class="vp-lhs">${problem.operator}</span>
                <span class="vp-rhs">${this.formatNumber(problem.operand2, numberType)}</span>
            </div>
            <div class="hline"></div>
        </div>
        <div class="work-lines" aria-hidden="true"></div>
        <div class="answer${showAnswers ? ' show-answer' : ''}">
            Answer: ${showAnswers ? this.formatNumber(problem.answer, numberType) : '<span class="blank"></span>'}
        </div>
    </div>`;
    }).join('\n');
  }

  // Generate multiple assessments with different problems
  static generateMultipleAssessments(
    baseOptions: Omit<PrintableAssessmentOptions, 'problems' | 'assessmentNumber'>,
    problemSets: MathProblem[][],
    startNumber: number = 1
  ): string[] {
    return problemSets.map((problems, index) => 
      this.generateHTML({
        ...baseOptions,
        problems,
        assessmentNumber: startNumber + index
      })
    );
  }

  // Generate answer key
  static generateAnswerKey(options: PrintableAssessmentOptions): string {
    return this.generateHTML({
      ...options,
      title: `${options.title} — Answer Key`,
      showAnswers: true
    });
  }

  // Convert HTML to blob for download
  static createDownloadBlob(html: string): Blob {
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  // Generate filename
  static generateFilename(title: string, assessmentNumber?: number, isAnswerKey: boolean = false): string {
    const sanitized = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const number = assessmentNumber ? `_${assessmentNumber}` : '';
    const suffix = isAnswerKey ? '_answer_key' : '';
    return `${sanitized}${number}${suffix}.html`;
  }
}
