export interface Fraction {
  numerator: number;
  denominator: number;
}

/**
 * Greatest Common Divisor using Euclidean algorithm
 */
export const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

/**
 * Simplify a fraction to its lowest terms
 */
export const simplifyFraction = (fraction: Fraction): Fraction => {
  if (fraction.numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  
  const divisor = gcd(fraction.numerator, fraction.denominator);
  let num = fraction.numerator / divisor;
  let den = fraction.denominator / divisor;
  
  // Handle negative denominators by moving sign to numerator
  if (den < 0) {
    num = -num;
    den = -den;
  }
  
  return { numerator: num, denominator: den };
};

/**
 * Convert fraction to decimal for comparison
 */
export const fractionToDecimal = (fraction: Fraction): number => {
  if (fraction.denominator === 0) return NaN;
  return fraction.numerator / fraction.denominator;
};

/**
 * Compare two fractions for equality
 */
export const compareFractions = (frac1: Fraction, frac2: Fraction): boolean => {
  // Simplify both fractions
  const simplified1 = simplifyFraction(frac1);
  const simplified2 = simplifyFraction(frac2);
  
  // Compare simplified fractions
  return simplified1.numerator === simplified2.numerator && 
         simplified1.denominator === simplified2.denominator;
};

/**
 * Parse a string into a fraction
 * Supports formats: "3/4", "1 2/3" (mixed numbers), "0.75", "3"
 */
export const parseFraction = (input: string): Fraction | null => {
  if (!input || typeof input !== 'string') return null;
  
  const trimmed = input.trim();
  
  // Handle mixed numbers (e.g., "1 2/3")
  const mixedMatch = trimmed.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const num = parseInt(mixedMatch[2]);
    const den = parseInt(mixedMatch[3]);
    
    if (den === 0) return null;
    
    const totalNumerator = Math.abs(whole) * den + num;
    return {
      numerator: whole < 0 ? -totalNumerator : totalNumerator,
      denominator: den
    };
  }
  
  // Handle simple fractions (e.g., "3/4")
  const fractionMatch = trimmed.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1]);
    const den = parseInt(fractionMatch[2]);
    
    if (den === 0) return null;
    
    return { numerator: num, denominator: den };
  }
  
  // Handle decimals (e.g., "0.75")
  const decimalMatch = trimmed.match(/^-?\d*\.\d+$/);
  if (decimalMatch) {
    const decimal = parseFloat(trimmed);
    if (isNaN(decimal)) return null;
    
    // Convert decimal to fraction
    const decimalPlaces = trimmed.split('.')[1].length;
    const denominator = Math.pow(10, decimalPlaces);
    const numerator = Math.round(decimal * denominator);
    
    return simplifyFraction({ numerator, denominator });
  }
  
  // Handle whole numbers (e.g., "3")
  const wholeMatch = trimmed.match(/^-?\d+$/);
  if (wholeMatch) {
    const num = parseInt(trimmed);
    if (isNaN(num)) return null;
    
    return { numerator: num, denominator: 1 };
  }
  
  return null;
};

/**
 * Format fraction as a string
 */
export const formatFraction = (fraction: Fraction, simplify: boolean = true): string => {
  if (!fraction) return '';
  
  const frac = simplify ? simplifyFraction(fraction) : fraction;
  
  if (frac.denominator === 1) {
    return frac.numerator.toString();
  }
  
  if (frac.numerator === 0) {
    return '0';
  }
  
  // Handle mixed numbers for improper fractions
  if (Math.abs(frac.numerator) > Math.abs(frac.denominator)) {
    const whole = Math.floor(Math.abs(frac.numerator) / Math.abs(frac.denominator));
    const remainder = Math.abs(frac.numerator) % Math.abs(frac.denominator);
    
    if (remainder === 0) {
      return (frac.numerator < 0 ? -whole : whole).toString();
    }
    
    const sign = frac.numerator < 0 ? '-' : '';
    return `${sign}${whole} ${remainder}/${Math.abs(frac.denominator)}`;
  }
  
  return `${frac.numerator}/${frac.denominator}`;
};

/**
 * Check if a fraction answer matches any of the acceptable answers
 * Handles multiple formats and equivalent fractions
 */
export const checkFractionAnswer = (
  studentAnswer: Fraction | string, 
  correctAnswers: (Fraction | string)[]
): boolean => {
  // Parse student answer
  let studentFraction: Fraction | null;
  if (typeof studentAnswer === 'string') {
    studentFraction = parseFraction(studentAnswer);
  } else {
    studentFraction = studentAnswer;
  }
  
  if (!studentFraction) return false;
  
  // Check against each correct answer
  for (const correctAnswer of correctAnswers) {
    let correctFraction: Fraction | null;
    if (typeof correctAnswer === 'string') {
      correctFraction = parseFraction(correctAnswer);
    } else {
      correctFraction = correctAnswer;
    }
    
    if (correctFraction && compareFractions(studentFraction, correctFraction)) {
      return true;
    }
  }
  
  return false;
};
