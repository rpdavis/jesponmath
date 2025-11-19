/**
 * Utility functions for processing and comparing student answers
 * Handles conversion between rich text HTML and plain text formats
 */

/**
 * Extract text from KaTeX-rendered HTML
 * KaTeX renders math as HTML with specific classes and structure
 */
export const extractTextFromKatexHtml = (htmlAnswer: string): string => {
  if (!htmlAnswer || typeof htmlAnswer !== 'string') {
    return '';
  }

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlAnswer;

  // KaTeX renders fractions as nested spans with specific structure
  // Look for .katex-html structure and extract text content
  const katexElements = tempDiv.querySelectorAll('.katex, .katex-display');
  
  if (katexElements.length > 0) {
    // Extract text from KaTeX elements
    // KaTeX stores the original LaTeX in data attributes or we can extract from rendered structure
    let extractedText = '';
    
    katexElements.forEach(el => {
      // Try to get the LaTeX source from data attribute if available
      const latexSource = el.getAttribute('data-latex') || el.getAttribute('data-original');
      
      if (latexSource) {
        extractedText += latexSource;
      } else {
        // Fall back to text content (may not be perfect but better than nothing)
        const textContent = el.textContent || (el as HTMLElement).innerText || '';
        extractedText += textContent;
      }
    });
    
    if (extractedText) {
      return extractedText.trim();
    }
  }

  // If no KaTeX elements found, try to extract plain text
  let plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up whitespace
  plainText = plainText
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\n+/g, ' ')  // Line breaks to spaces
    .trim();

  return plainText;
};

/**
 * Normalize LaTeX expression by extracting math content from $...$ wrappers
 * Also handles common LaTeX variations
 */
export const normalizeLatexExpression = (latex: string): string => {
  if (!latex || typeof latex !== 'string') {
    return '';
  }

  // Remove $ wrappers if present (handles both $...$ and $$...$$)
  let normalized = latex.trim();
  normalized = normalized.replace(/^\$\$?(.*?)\$\$?$/, '$1');
  
  // Normalize common LaTeX variations
  // \frac{1}{2} -> 1/2 (for comparison purposes)
  normalized = normalized.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
  
  // Handle absolute value notation - normalize |x| to |x| (keep as is, just ensure consistent spacing)
  // Remove any extra spaces around pipes
  normalized = normalized.replace(/\s*\|\s*/g, '|');
  
  // Normalize spacing (but preserve spaces that are part of the math)
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
};

/**
 * Convert rich text HTML answer to plain text for comparison
 * Converts inline fractions back to text format (e.g., "1/2")
 * Also handles KaTeX-rendered HTML
 */
export const convertHtmlAnswerToText = (htmlAnswer: string): string => {
  if (!htmlAnswer || typeof htmlAnswer !== 'string') {
    return '';
  }

  // Check if this is KaTeX-rendered HTML
  if (htmlAnswer.includes('katex') || htmlAnswer.includes('katex-html')) {
    return extractTextFromKatexHtml(htmlAnswer);
  }

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlAnswer;

  // Process inline fractions
  const fractionElements = tempDiv.querySelectorAll('.inline-fraction');
  fractionElements.forEach(fractionEl => {
    const numerator = fractionEl.querySelector('.fraction-num')?.textContent?.trim() || '';
    const denominator = fractionEl.querySelector('.fraction-den')?.textContent?.trim() || '';
    
    // Replace empty boxes with empty string
    const cleanNum = numerator === '□' ? '' : numerator;
    const cleanDen = denominator === '□' ? '' : denominator;
    
    // Create the text representation
    let fractionText = '';
    if (cleanNum && cleanDen) {
      fractionText = `${cleanNum}/${cleanDen}`;
    } else if (cleanNum) {
      fractionText = cleanNum;
    } else if (cleanDen) {
      fractionText = `?/${cleanDen}`;
    }
    
    // Replace the fraction element with plain text
    fractionEl.replaceWith(fractionText);
  });

  // Process superscripts (x² -> x^2)
  const supElements = tempDiv.querySelectorAll('sup');
  supElements.forEach(supEl => {
    const baseText = supEl.previousSibling?.textContent || '';
    const supText = supEl.textContent || '';
    supEl.replaceWith(`^${supText}`);
  });

  // Process subscripts (x₁ -> x_1)
  const subElements = tempDiv.querySelectorAll('sub');
  subElements.forEach(subEl => {
    const subText = subEl.textContent || '';
    subEl.replaceWith(`_${subText}`);
  });

  // Get the final plain text, clean up extra spaces and line breaks
  let plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up whitespace
  plainText = plainText
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\n+/g, ' ')  // Line breaks to spaces
    .trim();

  return plainText;
};

/**
 * Normalize answer for comparison (handles various formats)
 */
export const normalizeAnswer = (answer: string): string => {
  if (!answer || typeof answer !== 'string') {
    return '';
  }

  return answer
    .toLowerCase()
    .trim()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Normalize fraction spacing (1 / 2 -> 1/2)
    .replace(/\s*\/\s*/g, '/')
    // Normalize multiplication signs
    .replace(/×/g, '*')
    .replace(/·/g, '*')
    // Normalize division signs
    .replace(/÷/g, '/')
    // Remove spaces around operators
    .replace(/\s*([+\-*/^_=<>])\s*/g, '$1');
};

/**
 * Check if two LaTeX expressions are equivalent
 * Handles cases like $\frac{1}{2}$ vs $\frac{2}{4}$ vs $0.5$
 */
export const areLatexExpressionsEquivalent = (latex1: string, latex2: string): boolean => {
  if (!latex1 || !latex2) {
    return false;
  }

  // Normalize LaTeX expressions (remove $ wrappers, extract math content)
  const normalized1 = normalizeLatexExpression(latex1);
  const normalized2 = normalizeLatexExpression(latex2);

  // Try direct comparison of normalized LaTeX
  if (normalized1 === normalized2) {
    return true;
  }

  // Try evaluating as mathematical expressions
  // Extract numeric values from LaTeX
  try {
    // Handle fractions: \frac{1}{2} -> 1/2 -> 0.5
    const fractionPattern = /(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g;
    
    let val1: number | null = null;
    let val2: number | null = null;

    // Try to extract and evaluate fractions
    const fracMatch1 = normalized1.match(fractionPattern);
    const fracMatch2 = normalized2.match(fractionPattern);
    
    if (fracMatch1 && fracMatch1.length > 0) {
      const [num, den] = fracMatch1[0].split('/');
      val1 = parseFloat(num) / parseFloat(den);
    } else {
      // Try parsing as decimal
      const decimalMatch = normalized1.match(/-?\d+\.?\d*/);
      if (decimalMatch) {
        val1 = parseFloat(decimalMatch[0]);
      }
    }

    if (fracMatch2 && fracMatch2.length > 0) {
      const [num, den] = fracMatch2[0].split('/');
      val2 = parseFloat(num) / parseFloat(den);
    } else {
      // Try parsing as decimal
      const decimalMatch = normalized2.match(/-?\d+\.?\d*/);
      if (decimalMatch) {
        val2 = parseFloat(decimalMatch[0]);
      }
    }

    // Compare numeric values if both were successfully parsed
    if (val1 !== null && val2 !== null) {
      return Math.abs(val1 - val2) < 0.0001;
    }
  } catch (e) {
    // If evaluation fails, fall through to other comparison methods
  }

  return false;
};

/**
 * Check if two answers are equivalent (handles multiple formats)
 * Now also handles LaTeX/KaTeX expressions
 */
export const areAnswersEquivalent = (studentAnswer: string, correctAnswer: string): boolean => {
  if (!studentAnswer || !correctAnswer) {
    return false;
  }

  // Check if either answer contains LaTeX syntax ($...$)
  const hasLatex1 = studentAnswer.includes('$') || studentAnswer.includes('\\frac') || studentAnswer.includes('katex');
  const hasLatex2 = correctAnswer.includes('$') || correctAnswer.includes('\\frac') || correctAnswer.includes('katex');

  // If either answer is LaTeX, try LaTeX comparison first
  if (hasLatex1 || hasLatex2) {
    if (areLatexExpressionsEquivalent(studentAnswer, correctAnswer)) {
      return true;
    }
  }

  // Convert HTML answer to plain text if needed
  const studentPlainText = convertHtmlAnswerToText(studentAnswer);
  
  // Normalize both answers
  const normalizedStudent = normalizeAnswer(studentPlainText);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Direct comparison
  if (normalizedStudent === normalizedCorrect) {
    return true;
  }

  // Try evaluating simple fractions
  if (areFractionsEquivalent(normalizedStudent, normalizedCorrect)) {
    return true;
  }

  // Try evaluating simple expressions
  if (areExpressionsEquivalent(normalizedStudent, normalizedCorrect)) {
    return true;
  }

  return false;
};

/**
 * Check if two fractions are equivalent (e.g., 1/2 = 2/4)
 */
const areFractionsEquivalent = (answer1: string, answer2: string): boolean => {
  // Simple fraction pattern: number/number
  const fractionPattern = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/;
  
  const match1 = answer1.match(fractionPattern);
  const match2 = answer2.match(fractionPattern);
  
  if (match1 && match2) {
    const [, num1, den1] = match1;
    const [, num2, den2] = match2;
    
    const val1 = parseFloat(num1) / parseFloat(den1);
    const val2 = parseFloat(num2) / parseFloat(den2);
    
    // Compare with small tolerance for floating point precision
    return Math.abs(val1 - val2) < 0.0001;
  }
  
  return false;
};

/**
 * Check if two simple expressions are equivalent
 */
const areExpressionsEquivalent = (answer1: string, answer2: string): boolean => {
  // Try to evaluate simple numeric expressions
  try {
    // Only allow safe mathematical expressions
    const safePattern = /^[\d+\-*/().\s]+$/;
    
    if (safePattern.test(answer1) && safePattern.test(answer2)) {
      // Use Function constructor for safe evaluation (no eval)
      const evaluate = (expr: string) => {
        return new Function('return ' + expr)();
      };
      
      const val1 = evaluate(answer1);
      const val2 = evaluate(answer2);
      
      if (typeof val1 === 'number' && typeof val2 === 'number') {
        return Math.abs(val1 - val2) < 0.0001;
      }
    }
  } catch (e) {
    // If evaluation fails, fall back to string comparison
  }
  
  return false;
};

/**
 * Extract all fractions from an answer for debugging
 */
export const extractFractions = (htmlAnswer: string): string[] => {
  if (!htmlAnswer || typeof htmlAnswer !== 'string') {
    return [];
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlAnswer;
  
  const fractions: string[] = [];
  const fractionElements = tempDiv.querySelectorAll('.inline-fraction');
  
  fractionElements.forEach(fractionEl => {
    const numerator = fractionEl.querySelector('.fraction-num')?.textContent?.trim() || '';
    const denominator = fractionEl.querySelector('.fraction-den')?.textContent?.trim() || '';
    
    const cleanNum = numerator === '□' ? '' : numerator;
    const cleanDen = denominator === '□' ? '' : denominator;
    
    if (cleanNum && cleanDen) {
      fractions.push(`${cleanNum}/${cleanDen}`);
    }
  });
  
  return fractions;
};

/**
 * Debug function to show answer conversion
 */
export const debugAnswerConversion = (htmlAnswer: string) => {
  console.log('=== Answer Conversion Debug ===');
  console.log('Original HTML:', htmlAnswer);
  console.log('Converted Text:', convertHtmlAnswerToText(htmlAnswer));
  console.log('Normalized:', normalizeAnswer(convertHtmlAnswerToText(htmlAnswer)));
  console.log('Extracted Fractions:', extractFractions(htmlAnswer));
  console.log('===============================');
};


