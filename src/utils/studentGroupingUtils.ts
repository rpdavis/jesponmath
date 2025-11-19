/**
 * Student Grouping Utilities
 * 
 * Provides utilities for normalizing and grouping students by class and period.
 * Handles missing period data by extracting from class names and matching to common periods.
 */

import type { Student } from '@/types/users';

/**
 * Normalized student data with consistent className and period values
 */
export interface NormalizedStudent {
  student: Student;
  className: string;
  period: string;
}

/**
 * Student group structure
 */
export interface StudentGroup {
  key: string;
  className: string;
  period: string;
  students: Student[];
}

/**
 * Get the class name from a student, prioritizing Google Classroom fields
 * @param student The student object
 * @returns The class name or 'No Class' if not found
 */
export function getStudentClassName(student: Student): string {
  const className = student.courseName || student.className || 'No Class';
  // Trim whitespace to prevent grouping issues
  return className.trim();
}

/**
 * Get the period from a student, prioritizing Google Classroom section field
 * @param student The student object
 * @returns The period or undefined if not found
 */
export function getStudentPeriod(student: Student): string | undefined {
  // Trim whitespace to prevent grouping issues
  const period = student.section || student.period;
  return period ? period.trim() : undefined;
}

/**
 * Extract period information from a class name string
 * Handles various formats like "Q2 6 Period - Math - 7" -> "6th Period"
 * 
 * @param className The class name to extract period from
 * @returns The extracted period in normalized format (e.g., "6th Period") or null if not found
 */
export function extractPeriodFromClassName(className: string): string | null {
  if (!className) return null;
  
  // Try to match common period patterns in class names
  // Examples: "Q2 6 Period - Math - 7" -> "6th Period" or "6 Period"
  const periodPatterns = [
    /(\d+)(?:th|st|nd|rd)?\s*Period/gi,  // "6th Period", "6 Period"
    /Period\s*(\d+)/gi,                    // "Period 6"
    /(\d+)\s*Period/gi                     // "6 Period"
  ];
  
  for (const pattern of periodPatterns) {
    const match = className.match(pattern);
    if (match) {
      // Try to normalize to "Xth Period" format
      const periodNum = match[0].match(/\d+/)?.[0];
      if (periodNum) {
        // Check if it already has ordinal suffix
        if (match[0].match(/\d+(th|st|nd|rd)/i)) {
          return match[0].trim();
        }
        // Add ordinal suffix
        const num = parseInt(periodNum);
        const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
        return `${num}${suffix} Period`;
      }
    }
  }
  
  return null;
}

/**
 * Normalize a period value, extracting from className if missing
 * @param period The period value (may be undefined)
 * @param className The class name to extract from if period is missing
 * @returns Normalized period string
 */
export function normalizePeriod(period: string | undefined, className: string): string {
  // If period exists and is not "No Period", use it
  if (period && period !== 'No Period') {
    return period;
  }
  
  // Try to extract from className
  const extractedPeriod = extractPeriodFromClassName(className);
  if (extractedPeriod) {
    return extractedPeriod;
  }
  
  // Default to "No Period"
  return 'No Period';
}

/**
 * Normalize a student's class and period information
 * @param student The student to normalize
 * @returns Normalized student data
 */
export function normalizeStudent(student: Student): NormalizedStudent {
  const className = getStudentClassName(student);
  const period = normalizePeriod(getStudentPeriod(student), className);
  
  return {
    student,
    className,
    period
  };
}

/**
 * Find the most common period for a given class name
 * @param normalizedStudents Array of normalized students
 * @param className The class name to find the period for
 * @returns The most common period or null if none found
 */
export function findMostCommonPeriod(
  normalizedStudents: NormalizedStudent[],
  className: string
): string | null {
  // Count period occurrences for this class
  const periodCounts = new Map<string, number>();
  
  normalizedStudents.forEach(({ className: c, period: p }) => {
    if (c === className && p !== 'No Period') {
      periodCounts.set(p, (periodCounts.get(p) || 0) + 1);
    }
  });
  
  if (periodCounts.size === 0) {
    return null;
  }
  
  // Find the most common period
  const sortedPeriods = Array.from(periodCounts.entries())
    .sort((a, b) => b[1] - a[1]);
  
  return sortedPeriods[0]?.[0] || null;
}

/**
 * Group students by class and period with intelligent period matching
 * 
 * This function:
 * 1. Normalizes all students (extracts periods from class names if missing)
 * 2. For students with "No Period", matches them to the most common period in their class
 * 3. Groups students by className and period
 * 4. Returns sorted groups
 * 
 * @param students Array of students to group
 * @returns Array of student groups sorted by className and period
 */
export function groupStudentsByClassAndPeriod(students: Student[]): StudentGroup[] {
  if (students.length === 0) {
    return [];
  }
  
  // Step 1: Normalize all students
  const normalizedStudents = students.map(normalizeStudent);
  
  // Step 2: Build period frequency map for each class (for matching "No Period" students)
  const classNamePeriodMap = new Map<string, Map<string, number>>();
  
  normalizedStudents.forEach(({ className, period }) => {
    if (period !== 'No Period') {
      if (!classNamePeriodMap.has(className)) {
        classNamePeriodMap.set(className, new Map());
      }
      const periodMap = classNamePeriodMap.get(className)!;
      periodMap.set(period, (periodMap.get(period) || 0) + 1);
    }
  });
  
  // Step 3: Group students, matching "No Period" students to most common period
  const groups = new Map<string, StudentGroup>();
  
  normalizedStudents.forEach(({ student, className, period: originalPeriod }) => {
    let period = originalPeriod;
    
    // If period is "No Period", try to match to most common period in class
    if (period === 'No Period') {
      const periodMap = classNamePeriodMap.get(className);
      if (periodMap && periodMap.size > 0) {
        // Find most common period
        const sortedPeriods = Array.from(periodMap.entries())
          .sort((a, b) => b[1] - a[1]);
        if (sortedPeriods.length > 0) {
          period = sortedPeriods[0][0];
        }
      }
    }
    
    // Create group key
    const key = `${className}-${period}`;
    
    // Initialize group if it doesn't exist
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        className,
        period,
        students: []
      });
    }
    
    // Add student to group
    groups.get(key)!.students.push(student);
  });
  
  // Step 4: Convert to array and sort
  return Array.from(groups.values()).sort((a, b) => {
    if (a.className !== b.className) {
      return a.className.localeCompare(b.className);
    }
    return a.period.localeCompare(b.period);
  });
}



