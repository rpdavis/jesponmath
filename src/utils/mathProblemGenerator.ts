export interface MathProblem {
  id: string;
  expression: string;
  operand1: number;
  operand2: number;
  operator: string;
  answer: number;
  displayFormat: 'horizontal' | 'vertical';
}

export interface GeneratorOptions {
  operations: ('multiplication' | 'division' | 'addition' | 'subtraction')[];
  numberType: 'integers' | 'negative-integers' | 'decimals' | 'money';
  count: number;
  minDigits1: number;
  maxDigits1: number;
  minDigits2: number;
  maxDigits2: number;
  allowZeros: boolean;
  // Decimal-specific options
  minDecimalPlaces?: number;
  maxDecimalPlaces?: number;
  customRange1?: { min: number; max: number };
  customRange2?: { min: number; max: number };
  // Division-specific options
  wholeNumberQuotientsOnly?: boolean;
}

export class MathProblemGenerator {
  private usedProblems: Set<string> = new Set();

  // Helper method for precise decimal arithmetic
  private preciseCalculation(operand1: number, operand2: number, operation: string): number {
    // Convert to integers to avoid floating point errors
    const factor1 = this.getDecimalPlaces(operand1);
    const factor2 = this.getDecimalPlaces(operand2);
    const maxFactor = Math.max(factor1, factor2);
    const multiplier = Math.pow(10, maxFactor);
    
    const int1 = Math.round(operand1 * multiplier);
    const int2 = Math.round(operand2 * multiplier);
    
    let result: number;
    
    switch (operation) {
      case 'multiplication':
        result = (int1 * int2) / (multiplier * multiplier);
        break;
      case 'division':
        result = int1 / int2;
        break;
      case 'addition':
        result = (int1 + int2) / multiplier;
        break;
      case 'subtraction':
        result = (int1 - int2) / multiplier;
        break;
      default:
        result = 0;
    }
    
    // Round to reasonable number of decimal places (max 4)
    return Math.round(result * 10000) / 10000;
  }

  private getDecimalPlaces(num: number): number {
    const str = num.toString();
    if (str.indexOf('.') === -1) return 0;
    return str.split('.')[1].length;
  }

  generateProblems(options: GeneratorOptions): MathProblem[] {
    this.usedProblems.clear();
    const problems: MathProblem[] = [];

    let attempts = 0;
    const maxAttempts = options.count * 10; // Prevent infinite loops

    while (problems.length < options.count && attempts < maxAttempts) {
      attempts++;
      const problem = this.generateSingleProblem(options);
      
      if (problem && !this.usedProblems.has(problem.expression)) {
        this.usedProblems.add(problem.expression);
        problems.push(problem);
      }
    }

    return problems;
  }

  private generateSingleProblem(options: GeneratorOptions): MathProblem | null {
    if (options.operations.length === 0) return null;
    
    // Randomly select one of the chosen operations
    const randomOperation = options.operations[Math.floor(Math.random() * options.operations.length)];
    
    const operand1 = this.generateNumber(
      options.minDigits1, 
      options.maxDigits1, 
      options.allowZeros,
      options.customRange1,
      options.numberType,
      options
    );
    
    const operand2 = this.generateNumber(
      options.minDigits2, 
      options.maxDigits2, 
      options.allowZeros,
      options.customRange2,
      options.numberType,
      options
    );

    if (operand1 === null || operand2 === null) return null;

    let answer: number;
    let operator: string;

    switch (randomOperation) {
      case 'multiplication':
        answer = this.preciseCalculation(operand1, operand2, 'multiplication');
        operator = '×';
        break;
      case 'division':
        // For division, use operand1 as dividend (respects user's digit selection)
        // and operand2 as divisor, then calculate quotient
        let dividend = operand1;
        let divisor = operand2;
        
        // For division, keep divisor smaller to avoid huge problems
        if (divisor > 99) {
          divisor = Math.floor(Math.random() * 20) + 2; // 2-21 range for divisor
        }
        
        // If whole number quotients only is enabled, adjust dividend to be evenly divisible
        if (options.wholeNumberQuotientsOnly) {
          // Generate a reasonable quotient first, then calculate dividend
          const minQuotient = Math.max(1, Math.pow(10, options.minDigits1 - 1));
          const maxQuotient = Math.min(999, Math.pow(10, options.maxDigits1) - 1);
          const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient;
          dividend = quotient * divisor;
        }
        
        // Calculate quotient and remainder
        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;
        
        answer = quotient + (remainder > 0 ? remainder / divisor : 0);
        operator = '÷';
        return {
          id: `${Date.now()}_${Math.random()}`,
          expression: `${dividend} ${operator} ${divisor}`,
          operand1: dividend,
          operand2: divisor,
          operator,
          answer: quotient, // Store just the quotient for display
          displayFormat: 'vertical'
        };
      case 'addition':
        answer = this.preciseCalculation(operand1, operand2, 'addition');
        operator = '+';
        break;
      case 'subtraction':
        // Ensure positive result
        const larger = Math.max(operand1, operand2);
        const smaller = Math.min(operand1, operand2);
        answer = this.preciseCalculation(larger, smaller, 'subtraction');
        operator = '−';
        return {
          id: `${Date.now()}_${Math.random()}`,
          expression: `${larger} ${operator} ${smaller}`,
          operand1: larger,
          operand2: smaller,
          operator,
          answer,
          displayFormat: 'vertical'
        };
      default:
        return null;
    }

    return {
      id: `${Date.now()}_${Math.random()}`,
      expression: `${operand1} ${operator} ${operand2}`,
      operand1,
      operand2,
      operator,
      answer,
      displayFormat: 'vertical'
    };
  }

  private generateNumber(
    minDigits: number, 
    maxDigits: number, 
    allowZeros: boolean,
    customRange?: { min: number; max: number },
    numberType: GeneratorOptions['numberType'] = 'integers',
    options?: GeneratorOptions
  ): number | null {
    if (customRange) {
      let baseNumber = Math.floor(Math.random() * (customRange.max - customRange.min + 1)) + customRange.min;
      return this.applyNumberType(baseNumber, numberType, options);
    }

    const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
    
    let baseNumber: number;
    
    if (digits === 1) {
      baseNumber = allowZeros ? 
        Math.floor(Math.random() * 10) : 
        Math.floor(Math.random() * 9) + 1;
    } else {
      // Generate multi-digit number
      const min = Math.pow(10, digits - 1);
      const max = Math.pow(10, digits) - 1;
      baseNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    return this.applyNumberType(baseNumber, numberType, options);
  }

  private applyNumberType(baseNumber: number, numberType: GeneratorOptions['numberType'], options?: GeneratorOptions): number {
    switch (numberType) {
      case 'integers':
        return baseNumber;
      case 'negative-integers':
        // 50% chance of being negative
        return Math.random() < 0.5 ? -baseNumber : baseNumber;
      case 'decimals':
        // Use specified decimal places or default to 1-2
        const minPlaces = options?.minDecimalPlaces ?? 1;
        const maxPlaces = options?.maxDecimalPlaces ?? 2;
        const decimalPlaces = Math.floor(Math.random() * (maxPlaces - minPlaces + 1)) + minPlaces;
        
        // Create cleaner decimals by using specific decimal values
        const cleanDecimals = [
          [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], // 1 decimal place
          [0.25, 0.50, 0.75, 0.10, 0.20, 0.30, 0.40, 0.60, 0.70, 0.80, 0.90], // 2 decimal places - common fractions
          [0.125, 0.250, 0.375, 0.500, 0.625, 0.750, 0.875] // 3 decimal places - eighths
        ];
        
        if (decimalPlaces <= 3 && baseNumber < 10) {
          // For small numbers, use clean decimal values
          const decimalOptions = cleanDecimals[decimalPlaces - 1];
          const randomDecimal = decimalOptions[Math.floor(Math.random() * decimalOptions.length)];
          return baseNumber + randomDecimal;
        }
        
        // For larger numbers, create reasonable decimals
        const divisor = Math.pow(10, decimalPlaces);
        const decimalPart = Math.floor(Math.random() * divisor) / divisor;
        return Math.round((baseNumber + decimalPart) * divisor) / divisor;
      case 'money':
        // Convert to money format (always 2 decimal places, reasonable range)
        const moneyValue = baseNumber < 100 ? baseNumber : baseNumber / 100;
        return Math.round(moneyValue * 100) / 100;
      default:
        return baseNumber;
    }
  }

  // Generate specific problem types
  static generateMultiplicationSet(count: number = 10): MathProblem[] {
    const generator = new MathProblemGenerator();
    return generator.generateProblems({
      operations: ['multiplication'],
      numberType: 'integers',
      count,
      minDigits1: 3,
      maxDigits1: 4,
      minDigits2: 1,
      maxDigits2: 1,
      allowZeros: false
    });
  }

  static generateMixedOperations(count: number = 10): MathProblem[] {
    const generator = new MathProblemGenerator();
    return generator.generateProblems({
      operations: ['multiplication', 'division', 'addition', 'subtraction'],
      numberType: 'integers',
      count,
      minDigits1: 2,
      maxDigits1: 4,
      minDigits2: 1,
      maxDigits2: 2,
      allowZeros: false
    });
  }
}

// Preset generators for common assessment types
export const PresetGenerators = {
  multiplicationBasic: () => MathProblemGenerator.generateMultiplicationSet(10),
  
  multiplicationAdvanced: () => {
    const generator = new MathProblemGenerator();
    return generator.generateProblems({
      operations: ['multiplication'],
      numberType: 'integers',
      count: 10,
      minDigits1: 4,
      maxDigits1: 4,
      minDigits2: 2,
      maxDigits2: 2,
      allowZeros: false
    });
  },

  divisionBasic: () => {
    const generator = new MathProblemGenerator();
    return generator.generateProblems({
      operations: ['division'],
      numberType: 'integers',
      count: 10,
      minDigits1: 2,
      maxDigits1: 3,
      minDigits2: 1,
      maxDigits2: 1,
      allowZeros: false
    });
  },

  mixedOperations: () => MathProblemGenerator.generateMixedOperations(10),

  fractionMultiplication: () => {
    // Special case for fractions - will implement separately
    return [];
  }
};
