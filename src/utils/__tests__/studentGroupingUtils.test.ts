/**
 * Unit tests for studentGroupingUtils
 */

import { describe, it, expect } from 'vitest';
import {
  getStudentClassName,
  getStudentPeriod,
  extractPeriodFromClassName,
  normalizePeriod,
  normalizeStudent,
  findMostCommonPeriod,
  groupStudentsByClassAndPeriod
} from '../studentGroupingUtils';
import type { Student } from '@/types/users';

// Helper to create a mock student
const createMockStudent = (overrides: Partial<Student> = {}): Student => ({
  uid: 'test-uid',
  email: 'test@example.com',
  role: 'student',
  displayName: 'Test Student',
  firstName: 'Test',
  lastName: 'Student',
  isActive: true,
  hasIEP: false,
  has504: false,
  grade: '7',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('getStudentClassName', () => {
  it('should prioritize courseName over className', () => {
    const student = createMockStudent({
      courseName: 'Math 7',
      className: 'Algebra 1'
    });
    expect(getStudentClassName(student)).toBe('Math 7');
  });

  it('should use className if courseName is not available', () => {
    const student = createMockStudent({
      className: 'Algebra 1'
    });
    expect(getStudentClassName(student)).toBe('Algebra 1');
  });

  it('should return "No Class" if neither field exists', () => {
    const student = createMockStudent({});
    expect(getStudentClassName(student)).toBe('No Class');
  });
});

describe('getStudentPeriod', () => {
  it('should prioritize section over period', () => {
    const student = createMockStudent({
      section: '6th Period',
      period: '5th Period'
    });
    expect(getStudentPeriod(student)).toBe('6th Period');
  });

  it('should use period if section is not available', () => {
    const student = createMockStudent({
      period: '5th Period'
    });
    expect(getStudentPeriod(student)).toBe('5th Period');
  });

  it('should return undefined if neither field exists', () => {
    const student = createMockStudent({});
    expect(getStudentPeriod(student)).toBeUndefined();
  });
});

describe('extractPeriodFromClassName', () => {
  it('should extract period from "Q2 6 Period - Math - 7"', () => {
    const result = extractPeriodFromClassName('Q2 6 Period - Math - 7');
    expect(result).toBe('6th Period');
  });

  it('should extract period from "6th Period - Math 7"', () => {
    const result = extractPeriodFromClassName('6th Period - Math 7');
    expect(result).toBe('6th Period');
  });

  it('should extract period from "Period 6 - Math"', () => {
    const result = extractPeriodFromClassName('Period 6 - Math');
    expect(result).toBe('6th Period');
  });

  it('should handle ordinal suffixes correctly', () => {
    expect(extractPeriodFromClassName('1st Period')).toBe('1st Period');
    expect(extractPeriodFromClassName('2nd Period')).toBe('2nd Period');
    expect(extractPeriodFromClassName('3rd Period')).toBe('3rd Period');
    expect(extractPeriodFromClassName('4th Period')).toBe('4th Period');
  });

  it('should return null if no period pattern found', () => {
    expect(extractPeriodFromClassName('Math 7')).toBeNull();
    expect(extractPeriodFromClassName('')).toBeNull();
  });
});

describe('normalizePeriod', () => {
  it('should return existing period if provided', () => {
    expect(normalizePeriod('6th Period', 'Math 7')).toBe('6th Period');
  });

  it('should extract from className if period is missing', () => {
    expect(normalizePeriod(undefined, 'Q2 6 Period - Math - 7')).toBe('6th Period');
  });

  it('should extract from className if period is "No Period"', () => {
    expect(normalizePeriod('No Period', 'Q2 6 Period - Math - 7')).toBe('6th Period');
  });

  it('should return "No Period" if extraction fails', () => {
    expect(normalizePeriod(undefined, 'Math 7')).toBe('No Period');
  });
});

describe('normalizeStudent', () => {
  it('should normalize student with all fields', () => {
    const student = createMockStudent({
      courseName: 'Math 7',
      section: '6th Period'
    });
    const normalized = normalizeStudent(student);
    expect(normalized.className).toBe('Math 7');
    expect(normalized.period).toBe('6th Period');
    expect(normalized.student).toBe(student);
  });

  it('should extract period from className if missing', () => {
    const student = createMockStudent({
      courseName: 'Q2 6 Period - Math - 7'
    });
    const normalized = normalizeStudent(student);
    expect(normalized.period).toBe('6th Period');
  });

  it('should use "No Period" if period cannot be determined', () => {
    const student = createMockStudent({
      courseName: 'Math 7'
    });
    const normalized = normalizeStudent(student);
    expect(normalized.period).toBe('No Period');
  });
});

describe('findMostCommonPeriod', () => {
  it('should find most common period for a class', () => {
    const students = [
      normalizeStudent(createMockStudent({ courseName: 'Math 7', section: '6th Period' })),
      normalizeStudent(createMockStudent({ courseName: 'Math 7', section: '6th Period' })),
      normalizeStudent(createMockStudent({ courseName: 'Math 7', section: '5th Period' }))
    ];
    const result = findMostCommonPeriod(students, 'Math 7');
    expect(result).toBe('6th Period');
  });

  it('should return null if no periods found', () => {
    const students = [
      normalizeStudent(createMockStudent({ courseName: 'Math 7' }))
    ];
    const result = findMostCommonPeriod(students, 'Math 7');
    expect(result).toBeNull();
  });

  it('should handle empty array', () => {
    const result = findMostCommonPeriod([], 'Math 7');
    expect(result).toBeNull();
  });
});

describe('groupStudentsByClassAndPeriod', () => {
  it('should group students by class and period', () => {
    const students = [
      createMockStudent({ uid: '1', courseName: 'Math 7', section: '6th Period' }),
      createMockStudent({ uid: '2', courseName: 'Math 7', section: '6th Period' }),
      createMockStudent({ uid: '3', courseName: 'Math 7', section: '5th Period' })
    ];
    
    const groups = groupStudentsByClassAndPeriod(students);
    
    expect(groups).toHaveLength(2);
    expect(groups[0].className).toBe('Math 7');
    expect(groups[0].students).toHaveLength(2);
    expect(groups[1].students).toHaveLength(1);
  });

  it('should match "No Period" students to most common period', () => {
    const students = [
      createMockStudent({ uid: '1', courseName: 'Math 7', section: '6th Period' }),
      createMockStudent({ uid: '2', courseName: 'Math 7', section: '6th Period' }),
      createMockStudent({ uid: '3', courseName: 'Math 7' }) // No period
    ];
    
    const groups = groupStudentsByClassAndPeriod(students);
    
    expect(groups).toHaveLength(1);
    expect(groups[0].students).toHaveLength(3);
    expect(groups[0].period).toBe('6th Period');
  });

  it('should extract period from className if missing', () => {
    const students = [
      createMockStudent({ uid: '1', courseName: 'Q2 6 Period - Math - 7' })
    ];
    
    const groups = groupStudentsByClassAndPeriod(students);
    
    expect(groups).toHaveLength(1);
    expect(groups[0].period).toBe('6th Period');
  });

  it('should return empty array for empty input', () => {
    const groups = groupStudentsByClassAndPeriod([]);
    expect(groups).toHaveLength(0);
  });

  it('should sort groups by className and period', () => {
    const students = [
      createMockStudent({ uid: '1', courseName: 'Math 7', section: '6th Period' }),
      createMockStudent({ uid: '2', courseName: 'Math 7', section: '5th Period' }),
      createMockStudent({ uid: '3', courseName: 'Algebra 1', section: '1st Period' })
    ];
    
    const groups = groupStudentsByClassAndPeriod(students);
    
    expect(groups[0].className).toBe('Algebra 1');
    expect(groups[1].className).toBe('Math 7');
    expect(groups[1].period).toBe('5th Period');
    expect(groups[2].period).toBe('6th Period');
  });
});







