/**
 * Utility functions for processing and comparing student answers
 * Handles conversion between rich text HTML and plain text formats
 */

/**
 * Convert rich text HTML answer to plain text for comparison
 * Converts inline fractions back to text format (e.g., "1/2")
 */
export const convertHtmlAnswerToText = (htmlAnswer: string): string => {
  if (!htmlAnswer || typeof htmlAnswer !== 'string') {
    return '';
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
 * Check if two answers are equivalent (handles multiple formats)
 */
export const areAnswersEquivalent = (studentAnswer: string, correctAnswer: string): boolean => {
  if (!studentAnswer || !correctAnswer) {
    return false;
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
