/**
 * Utility functions for handling multiple standards per question
 */

/**
 * Parse a standards string into an array of individual standards
 * @param standardsString - String with standards separated by ';'
 * @returns Array of individual standards, trimmed and filtered
 */
export const parseStandards = (standardsString?: string): string[] => {
  if (!standardsString || typeof standardsString !== 'string') {
    return [];
  }
  
  return standardsString
    .split(';')
    .map(standard => standard.trim())
    .filter(standard => standard.length > 0);
};

/**
 * Format an array of standards into a display string
 * @param standards - Array of standards
 * @returns Formatted string for display
 */
export const formatStandardsForDisplay = (standards: string[]): string => {
  if (!standards || standards.length === 0) {
    return '';
  }
  
  if (standards.length === 1) {
    return standards[0];
  }
  
  if (standards.length === 2) {
    return standards.join(' & ');
  }
  
  return standards.slice(0, -1).join(', ') + ' & ' + standards[standards.length - 1];
};

/**
 * Join standards array back into a string for storage
 * @param standards - Array of standards
 * @returns String with standards joined by ';'
 */
export const joinStandards = (standards: string[]): string => {
  return standards
    .filter(standard => standard && standard.trim().length > 0)
    .map(standard => standard.trim())
    .join('; ');
};

/**
 * Check if a question satisfies a specific standard
 * @param question - Assessment question
 * @param targetStandard - Standard to check for
 * @returns True if question covers the target standard
 */
export const questionCoversStandard = (question: any, targetStandard: string): boolean => {
  if (!question || !targetStandard) {
    return false;
  }
  
  const questionStandards = parseStandards(question.standard);
  return questionStandards.some(standard => 
    standard.toLowerCase().includes(targetStandard.toLowerCase()) ||
    targetStandard.toLowerCase().includes(standard.toLowerCase())
  );
};

/**
 * Get all unique standards from a list of questions
 * @param questions - Array of assessment questions
 * @returns Array of unique standards
 */
export const getAllStandardsFromQuestions = (questions: any[]): string[] => {
  const allStandards = new Set<string>();
  
  questions.forEach(question => {
    const standards = parseStandards(question.standard);
    standards.forEach(standard => allStandards.add(standard));
  });
  
  return Array.from(allStandards).sort();
};

/**
 * Group questions by standards (a question can appear in multiple groups)
 * @param questions - Array of assessment questions
 * @returns Object with standards as keys and arrays of questions as values
 */
export const groupQuestionsByStandards = (questions: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};
  
  questions.forEach(question => {
    const standards = parseStandards(question.standard);
    
    if (standards.length === 0) {
      // Handle questions without standards
      if (!groups['No Standard']) {
        groups['No Standard'] = [];
      }
      groups['No Standard'].push(question);
    } else {
      // Add question to each standard group
      standards.forEach(standard => {
        if (!groups[standard]) {
          groups[standard] = [];
        }
        groups[standard].push(question);
      });
    }
  });
  
  return groups;
};


