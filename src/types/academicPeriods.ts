// Academic Period Types
// Defines quarters, semesters, trimesters with date ranges

export type PeriodType = 'quarters' | 'semesters' | 'trimesters';

export interface AcademicPeriod {
  id: string;                    // e.g., "q1", "s1", "t1"
  name: string;                  // e.g., "Quarter 1", "First Semester"
  shortName: string;             // e.g., "Q1", "S1", "T1"
  startDate: Date;               // Period start date
  endDate: Date;                 // Period end date
  isActive: boolean;             // Is this period currently active?
  isFuture: boolean;             // Is this period in the future?
  isPast: boolean;               // Is this period in the past?
}

export interface AcademicYear {
  year: string;                  // e.g., "2024-2025"
  startDate: Date;               // School year start
  endDate: Date;                 // School year end
  periodType: PeriodType;        // quarters|semesters|trimesters
  periods: AcademicPeriod[];     // Array of periods for this year
}

// Default academic year configurations
export const ACADEMIC_YEAR_TEMPLATES = {
  quarters: {
    periodCount: 4,
    periods: [
      { name: "Quarter 1", shortName: "Q1", months: [8, 9, 10] },      // Aug-Oct
      { name: "Quarter 2", shortName: "Q2", months: [11, 12, 1] },     // Nov-Jan
      { name: "Quarter 3", shortName: "Q3", months: [2, 3, 4] },       // Feb-Apr
      { name: "Quarter 4", shortName: "Q4", months: [5, 6, 7] }        // May-Jul
    ]
  },
  semesters: {
    periodCount: 2,
    periods: [
      { name: "First Semester", shortName: "S1", months: [8, 9, 10, 11, 12] },  // Aug-Dec
      { name: "Second Semester", shortName: "S2", months: [1, 2, 3, 4, 5, 6] }  // Jan-Jun
    ]
  },
  trimesters: {
    periodCount: 3,
    periods: [
      { name: "First Trimester", shortName: "T1", months: [8, 9, 10, 11] },     // Aug-Nov
      { name: "Second Trimester", shortName: "T2", months: [12, 1, 2, 3] },     // Dec-Mar
      { name: "Third Trimester", shortName: "T3", months: [4, 5, 6, 7] }        // Apr-Jul
    ]
  }
} as const;

// Helper functions
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  // Academic year starts in August (month 8)
  if (currentMonth >= 8) {
    return `${now.getFullYear()}-${now.getFullYear() + 1}`;
  } else {
    return `${now.getFullYear() - 1}-${now.getFullYear()}`;
  }
}

export function generateAcademicYear(year: string, periodType: PeriodType): AcademicYear {
  const [startYear, endYear] = year.split('-').map(y => parseInt(y));
  
  const yearStartDate = new Date(startYear, 7, 15); // August 15
  const yearEndDate = new Date(endYear, 5, 30);     // June 30
  
  const template = ACADEMIC_YEAR_TEMPLATES[periodType];
  const periods: AcademicPeriod[] = [];
  
  template.periods.forEach((periodTemplate, index) => {
    const periodId = `${periodTemplate.shortName.toLowerCase()}`;
    
    // Calculate start and end dates based on months
    const startMonth = periodTemplate.months[0];
    const endMonth = periodTemplate.months[periodTemplate.months.length - 1];
    
    // Handle year transition (e.g., Nov-Jan spans two calendar years)
    const startCalendarYear = startMonth >= 8 ? startYear : endYear;
    const endCalendarYear = endMonth >= 8 ? startYear : endYear;
    
    const startDate = new Date(startCalendarYear, startMonth - 1, 1); // First day of start month
    const endDate = new Date(endCalendarYear, endMonth, 0);           // Last day of end month
    
    const now = new Date();
    const isActive = now >= startDate && now <= endDate;
    const isFuture = now < startDate;
    const isPast = now > endDate;
    
    periods.push({
      id: periodId,
      name: periodTemplate.name,
      shortName: periodTemplate.shortName,
      startDate,
      endDate,
      isActive,
      isFuture,
      isPast
    });
  });
  
  return {
    year,
    startDate: yearStartDate,
    endDate: yearEndDate,
    periodType,
    periods
  };
}

export function getCurrentPeriod(academicYear: AcademicYear): AcademicPeriod | null {
  return academicYear.periods.find(period => period.isActive) || null;
}

export function getDefaultPeriod(academicYear: AcademicYear): AcademicPeriod {
  // Return current period, or if none active, return the most recent past period
  const currentPeriod = getCurrentPeriod(academicYear);
  if (currentPeriod) return currentPeriod;
  
  const pastPeriods = academicYear.periods.filter(p => p.isPast);
  if (pastPeriods.length > 0) {
    return pastPeriods[pastPeriods.length - 1]; // Most recent past period
  }
  
  // If no past periods, return first period
  return academicYear.periods[0];
}

export function filterAssessmentsByPeriod(assessments: any[], period: AcademicPeriod): any[] {
  return assessments.filter(assessment => {
    // Priority 1: Use assignment start/end dates if both are set
    if (assessment.assignDate && assessment.dueDate) {
      const assignStart = assessment.assignDate?.toDate?.() || new Date(assessment.assignDate);
      const assignEnd = assessment.dueDate?.toDate?.() || new Date(assessment.dueDate);
      
      // Assessment should show in period if:
      // - Assignment starts before period ends AND
      // - Assignment ends after period starts (overlaps with period)
      const overlapsWithPeriod = assignStart <= period.endDate && assignEnd >= period.startDate;
      
      console.log(`📅 Assessment "${assessment.title}": Assign ${assignStart.toLocaleDateString()} - ${assignEnd.toLocaleDateString()}, Period ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}, Overlaps: ${overlapsWithPeriod}`);
      
      return overlapsWithPeriod;
    }
    
    // Priority 2: Use assignment start date if only start is set
    if (assessment.assignDate) {
      const assignStart = assessment.assignDate?.toDate?.() || new Date(assessment.assignDate);
      const isInPeriod = assignStart >= period.startDate && assignStart <= period.endDate;
      
      console.log(`📅 Assessment "${assessment.title}": Assign start ${assignStart.toLocaleDateString()}, Period ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}, In period: ${isInPeriod}`);
      
      return isInPeriod;
    }
    
    // Fallback: Use creation date if no assignment dates are set
    const createdAt = assessment.createdAt?.toDate?.() || new Date(assessment.createdAt);
    const isInPeriod = createdAt >= period.startDate && createdAt <= period.endDate;
    
    console.log(`📅 Assessment "${assessment.title}": Created ${createdAt.toLocaleDateString()} (fallback), Period ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}, In period: ${isInPeriod}`);
    
    return isInPeriod;
  });
}

export function filterResultsByPeriod(results: any[], period: AcademicPeriod): any[] {
  return results.filter(result => {
    const completedAt = result.completedAt?.toDate?.() || new Date(result.completedAt);
    return completedAt >= period.startDate && completedAt <= period.endDate;
  });
}
