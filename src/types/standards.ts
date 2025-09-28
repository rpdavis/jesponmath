// Standards Management Types
// Custom standards and Common Core State Standards (CCSS) integration

export interface CustomStandard {
  id: string; // Auto-generated document ID
  name: string; // Custom name (e.g., "Fraction Operations Mastery")
  code: string; // Short code (e.g., "FOM-7.1")
  grade: string; // Grade level (K, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
  description?: string; // Optional detailed description
  ccssAlignment?: string; // Optional CCSS standard this aligns to
  category?: 'Number & Operations' | 'Algebra' | 'Geometry' | 'Measurement' | 'Data Analysis' | 'Problem Solving' | 'Other';
  
  // Metadata
  createdBy: string; // Teacher/admin UID who created
  isActive: boolean; // Whether this standard is available for use
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  
  // Usage tracking
  usageCount?: number; // How many assessments use this standard
  lastUsed?: any; // Timestamp of last use
}

export interface CCSSStandard {
  code: string; // Official CCSS code (e.g., "7.NS.A.1")
  grade: string; // Grade level
  domain: string; // Math domain (e.g., "Number System")
  cluster: string; // Cluster within domain
  title: string; // Short title
  description: string; // Full standard description
  category: 'Number & Operations' | 'Algebra' | 'Geometry' | 'Measurement' | 'Data Analysis' | 'Statistics & Probability' | 'Reading' | 'Writing' | 'Language' | 'Speaking & Listening';
}

export interface StandardSelection {
  type: 'custom' | 'ccss';
  standardId: string; // Either custom standard ID or CCSS code
  standard: CustomStandard | CCSSStandard;
}

// Grade levels for dropdown
export const GRADE_LEVELS = [
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' }
] as const;

// Standard categories
export const STANDARD_CATEGORIES = [
  { value: 'Number & Operations', label: '🔢 Number & Operations' },
  { value: 'Algebra', label: '📊 Algebra' },
  { value: 'Geometry', label: '📐 Geometry' },
  { value: 'Measurement', label: '📏 Measurement' },
  { value: 'Data Analysis', label: '📈 Data Analysis' },
  { value: 'Statistics & Probability', label: '🎲 Statistics & Probability' },
  { value: 'Problem Solving', label: '🧩 Problem Solving' },
  { value: 'Other', label: '📚 Other' }
] as const;